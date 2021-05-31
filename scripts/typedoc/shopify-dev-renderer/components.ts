import {resolve, extname} from 'path';
import * as fs from 'fs';

import type {
  Paths,
  Packages,
} from '../types';

import {createDependencyGraph} from '../utilities/dependency-graph';

import {renderYamlFrontMatter, findUuid, dedupe, propsTable, strip, firstSentence} from './shared';
import type {Node} from './shared';

interface Content {
  title: string;
  frontMatterDescription: string;
  description: string;
}

interface Options {
  subcomponentMap?: {[rootComponent: string]: string[]};
  componentsToSkip?: string[];
  generateReadmes?: boolean;
}

export async function components(paths: Paths, content: Content, options?: Options) {
  const {title, frontMatterDescription, description} = content;
  const componentIndex = resolve(`${paths.inputRoot}/src/components/index.ts`);
  const {nodes, components} = await buildComponentGraph(componentIndex);

  const outputRoot = resolve(`${paths.outputRoot}`);
  const componentDocsPath = resolve(`${paths.outputRoot}/components`);

  if (!fs.existsSync(outputRoot)) {
    fs.mkdirSync(outputRoot, {recursive: true});
  }

  if (!fs.existsSync(componentDocsPath)) {
    fs.mkdirSync(componentDocsPath, {recursive: true});
  }

  const indexFile = resolve(`${paths.outputRoot}/components/index.md`);
  let index = renderYamlFrontMatter({
    gid: findUuid(indexFile),
    url: `${paths.shopifyDevUrl}/components/index`,
    title: title,
    description: frontMatterDescription,
    hidden: true,
  });

  index += `${description}\n\n`;

  index += '<ul style="column-count: auto;column-width: 12rem;">';

  components.forEach(({value: {name, docs, props}}: any) => {
    if (options?.componentsToSkip?.includes(name)) return;

    const filename = name.toLowerCase();
    const outputFile = `${componentDocsPath}/${filename}.md`;

    const docsContent = docs ? strip(docs.content).trim() : '';

    const componentUrl = `${
      paths.shopifyDevUrl
    }/components/${filename}`;

    let markdown = renderYamlFrontMatter({
      gid: findUuid(outputFile),
      url: componentUrl,
      title: `${name}`,
      description: `"${firstSentence(docsContent)}"`,
      hidden: true,
    });
    const docsContentMd = docsContent ? `${docsContent}\n\n` : '';
    markdown += docsContentMd;

    markdown += renderExampleImageFor(name, paths.shopifyDevAssets);

    const examples = renderComponentExamplesFor(name, paths.packages);
    if (examples.length > 0) {
      markdown += examples;
    }

    const additionalPropsTables: string[] = [];
    let propsTableMd = '';
    const face = nodes.find(({value}: any) => value.name === props.name);
    if (
      face &&
      face.value.kind === 'InterfaceType' &&
      face.value.properties.length > 0
    ) {
      propsTableMd += '## Props\noptional = ?\n';
      propsTableMd += propsTable(
        name,
        docs,
        face.value.properties,
        nodes,
        componentIndex,
        additionalPropsTables,
        false,
        undefined,
      );
    }
    markdown += propsTableMd;

    const additionalPropsTablesMd = dedupe(additionalPropsTables).reverse().join('');
    markdown += additionalPropsTablesMd;

    if (options && options.subcomponentMap && Object.keys(options.subcomponentMap).includes(name)) {
      const subcomponentsMd = options.subcomponentMap[name].map((subcomponent) => {
        const {value: {name: subName, docs: subDocs, props: subProps}} = components.find(({value}: any) => value.name === subcomponent) as any;

        const subTitle = `## ${subName}\n\n`
        const subDocsContent = subDocs ? strip(subDocs.content).trim() : '';
        const subDocsContentMd = subDocsContent ? `${subDocsContent}\n\n` : '';
        const subAdditionalPropsTables: string[] = [];
        let subPropsTableMd = '';
        const subFace = nodes.find(({value}: any) => value.name === subProps.name);
        if (
          subFace &&
          subFace.value.kind === 'InterfaceType' &&
          subFace.value.properties.length > 0
        ) {
          subPropsTableMd += '### Props\noptional = ?\n';
          subPropsTableMd += propsTable(
            subName,
            subDocs,
            subFace.value.properties,
            nodes,
            componentIndex,
            subAdditionalPropsTables,
            false,
            undefined,
          );
        }

        return subTitle + subDocsContentMd + subPropsTableMd + subAdditionalPropsTables;
      }).join('\n\n');

      markdown += '\n\n' + subcomponentsMd;
    }

    const contentFolder = resolve(
      `${paths.inputRoot}/src/components/${name}/content`,
    );
    const additionalContent = '\n\n' + getAdditionalContentFor(contentFolder, paths.shopifyDevUrl);
    markdown += additionalContent;

    fs.writeFile(outputFile, markdown, function (err) {
      if (err) throw err;
    });

    if (options?.generateReadmes === true) {
      const readmeFile = resolve(`${paths.inputRoot}/src/components/${name}/README.md`);
      const title = `# ${name}\n\n`;
      let readmeMarkdown = title + docsContentMd + propsTableMd + additionalPropsTablesMd;

      fs.writeFile(readmeFile, readmeMarkdown, function (err) {
        if (err) throw err;
      });
    }

    index += `<li><a href="${componentUrl}">${name}</a></li>`;
  });

  index += '</ul>';

  // Write the component table of contents
  fs.writeFile(indexFile, index, function (err) {
    if (err) throw err;
  });
}

async function buildComponentGraph(componentIndex: string) {
  const graph = await createDependencyGraph(componentIndex);

  const nodes: Node[] = [];

  graph.forEach((value) => {
    value.locals.forEach((value: any, key) => {
      if (value.kind !== 'Imported') {
        if (value.name == null) {
          value.name = key;
        }
        nodes.push({value, module: undefined});
      }
    });
  });

  const components = [
    ...new Set(nodes.filter(({value}: any) => value.kind === 'Component')),
  ];

  // console.log(JSON.stringify(nodes))

  // Sort alphabetically (tsdoc seems to get this confused)
  components.sort((aa: any, bb: any) => {
    if (aa.value.name > bb.value.name) {
      return 1;
    } else if (aa.value.name < bb.value.name) {
      return -1;
    } else {
      return 0;
    }
  });

  return {nodes, components};
}

function renderComponentExamplesFor(name: string, packages: Packages): string {
  const examples: any = {};

  Object.keys(packages).forEach((packageName) => {
    const packagePath = packages[packageName];
    const folder = resolve(`${packagePath}/src/components/${name}/examples`);

    if (fs.existsSync(folder)) {
      fs.readdirSync(folder).forEach((file) => {
        const extension = extname(file).split('.').pop();
        examples[packageName] = `{% highlight ${extension} %}{% raw %}\n`;
        examples[packageName] += fs.readFileSync(`${folder}/${file}`, 'utf8');
        examples[packageName] += '\n{% endraw %}{% endhighlight %}\n\n';
      });
    }
  });

  let markdown = '';

  const exampleCount = Object.keys(examples).length;

  if (exampleCount > 1) {
    const sections = Object.keys(examples).join(', ');
    markdown += `{% sections "${sections}" %}\n\n`;
    markdown += Object.values(examples).join('\n\n----\n\n');
    markdown += '{% endsections %}\n\n';
  } else if (exampleCount > 0) {
    markdown += Object.values(examples).join('\n\n----\n\n');
  }

  return markdown;
}

function renderExampleImageFor(componentName: string, shopifyDevAssetsUrl: string) {
  const filename = componentName.toLowerCase();
  const image = resolve(`${shopifyDevAssetsUrl}/components/${filename}.png`);
  if (fs.existsSync(image)) {
    return `---\n### Example\n![${filename}](/assets/api/checkout-extensions/components/${filename}.png)`;
  }

  return '';
}

function getAdditionalContentFor(contentFolder: string, shopifyDevUrl: string) {
  let markdown = '';

  if (fs.existsSync(contentFolder)) {
    fs.readdirSync(contentFolder).forEach((file) => {
      markdown += fs.readFileSync(`${contentFolder}/${file}`, 'utf8');
    });
  }

  markdown = markdown.replace(/https:\/\/github\.com\/Shopify\/argo\/tree\/main\/packages\/argo-checkout\/src\/components\/(\w+)/g, (_match, p1) => `${shopifyDevUrl}/components/${p1}`.toLowerCase());
  markdown = markdown.replace(/https:\/\/github\.com\/Shopify\/checkout-web\/tree\/master\/packages\/argo-checkout\/src\/components\/(\w+)/g, (_match, p1) => `${shopifyDevUrl}/components/${p1}`.toLowerCase());

  return markdown;
}