/*
 * ©Vidoos Mahin LTD's products Developed by Tanvir
 */
import { env } from '../../config/env';

// Sandbox vs Live URL logic
const PAYPAL_API = env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

// Helper to get Access Token
async function getAccessToken() {
  const auth = Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  
  const data = await response.json();
  
  if (!data.access_token) {
    console.error('❌ PayPal Auth Failed:', data);
    throw new Error('Failed to retrieve PayPal Access Token');
  }

  return data.access_token;
}

// 1. Create Subscription
export const createSubscription = async (planId: string) => {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(`${PAYPAL_API}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: planId,
        application_context: {
          return_url: `${env.FRONTEND_URL}/payment/success`,
          cancel_url: `${env.FRONTEND_URL}/payment/cancel`,
          user_action: 'SUBSCRIBE_NOW'
        }
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'PayPal Subscription Creation Failed');
    }
    return data;
  } catch (error) {
    throw error;
  }
};

// 2. Cancel Subscription (NEW)
export const cancelPayPalSubscription = async (subscriptionId: string, reason: string = "User requested cancellation") => {
  try {
    const accessToken = await getAccessToken();

    console.log(`🔌 Cancelling PayPal Subscription: ${subscriptionId}`);

    const response = await fetch(`${PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });

    // PayPal returns 204 No Content on success
    if (response.status === 204) {
      return true;
    }

    // Handle errors
    const data = await response.json();
    console.error('❌ PayPal Cancel Error:', data);
    throw new Error(data.message || 'Failed to cancel subscription on PayPal');
  } catch (error) {
    throw error;
  }
};