import React from 'react';
import {reactExtension, TextField} from '@shopify/ui-extensions-react/admin';

function App() {
  return (
    <TextField
      label="Super text field"
      type="text"
      value="I can fly!"
      placeholder="Type a thing"
      multiline={3}
      prefix="I typed:"
      suffix="into this text field"
      error="I hate to break this to you, but you cannot fly"
      onChange={(value) => console.log(value, ' was typed')}
      onInput={(value) => console.log(value, ' was typed')}
      onFocus={() => console.log('Welcome to the super field!')}
      onBlur={() => console.log('Left to do something else')}
      clearButton
      onClearButtonPress={() => console.log('Clear that silly statement')}
    />
  );
}

export default reactExtension('Playground', () => <App />);