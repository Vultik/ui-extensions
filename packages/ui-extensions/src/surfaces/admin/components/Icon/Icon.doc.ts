import {ReferenceEntityTemplateSchema} from '@shopify/generate-docs';

const data: ReferenceEntityTemplateSchema = {
  name: 'Icon',
  description:
    'This component renders an icon from a predefined list. Choose the one that suits your needs.',
  requires: '',
  thumbnail: 'icon-thumbnail.png',
  isVisualComponent: true,
  type: '',
  definitions: [
    {
      title: 'IconProps',
      description: '',
      type: 'IconProps',
    },
    {
      title: 'IconName',
      description: 'List of available Icons for the Icon component',
      type: 'IconName',
    },
  ],
  category: 'Components',
  subCategory: 'Media',
  defaultExample: {
    image: 'icon-default.png',
    codeblock: {
      title: 'Simple Icon example',
      tabs: [
        {
          title: 'React',
          code: '../../../../../../ui-extensions-react/src/surfaces/admin/components/Icon/examples/basic-Icon.example.tsx',
          language: 'tsx',
        },
        {
          title: 'JS',
          code: './examples/basic-Icon.example.ts',
          language: 'js',
        },
      ],
    },
  },

  related: [
    {
      type: 'component',
      name: 'Image',
      url: '/docs/api/admin-extensions/components/media/image',
    },
  ],
};

export default data;