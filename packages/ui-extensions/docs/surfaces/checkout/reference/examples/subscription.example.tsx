import React from 'react';
import {
  reactExtension,
  Banner,
  useApi,
  useSubscription,
} from '@shopify/checkout-ui-extensions-react';

reactExtension(
  'Checkout::Dynamic::Render',
  () => <Extension />,
);

function Extension() {
  const {cost} = useApi();

  // Equivalent to the useTotalAmount() hook to subscribe and re-render your extension on changes
  const totalAmount = useSubscription(
    cost.totalAmount,
  );

  return <Banner>{totalAmount.amount}</Banner>;
}