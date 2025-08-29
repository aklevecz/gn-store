/**
 * MCP server communication utilities for agent
 */

const API_ENDPOINT = '/api/agent';

export async function fetchAgentInsight(context) {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getInsight',
        context,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch insight');
    }

    const data = await response.json();
    return data.insight;
  } catch (error) {
    console.error('Error fetching agent insight:', error);
    return null;
  }
}

export async function sendFeedAction(itemId) {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'feedItem',
        item: itemId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send feed action');
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error sending feed action:', error);
    return null;
  }
}

export async function syncAgentStats(stats) {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'updateStats',
        stats,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to sync stats');
    }

    const data = await response.json();
    return data.stats;
  } catch (error) {
    console.error('Error syncing agent stats:', error);
    return null;
  }
}

export async function getAgentRecommendation(context) {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getRecommendation',
        context,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get recommendation');
    }

    const data = await response.json();
    return data.recommendation;
  } catch (error) {
    console.error('Error getting recommendation:', error);
    return null;
  }
}