import React from 'react';
import {
  BlockStack,
  reactExtension,
  Text,
  useApi,
} from '@shopify/checkout-ui-extensions-react';

// 1. Choose an extension point
reactExtension(
  'Checkout::Dynamic::Render',
  () => <Extension />,
);

function Extension() {
  // 2. Use the extension API to gather context from the checkout and shop
  const {cost, shop} = useApi();

  // 3. Render a UI
  return (
    <BlockStack>
      <Text>Shop name: {shop.name}</Text>
      <Text>cost: {cost.totalAmount}</Text>
    </BlockStack>
  );
}