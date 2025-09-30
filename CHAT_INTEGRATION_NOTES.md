# Chat Widget Integration Notes

## Overview
The AnomFIN website now includes a fully functional chat widget designed to promote and sell AnomFIN services. The chat interface is styled to match the existing design language and is fully responsive across all devices.

## Current Implementation
The chat widget currently uses **simulated ChatGPT responses** implemented in the `simulateChatGPTResponse()` function in `js/script.js`. This provides a working demo that responds intelligently to user queries about:

- Pricing and service packages
- Cybersecurity services
- Application development
- Demos and contact information

## Production Deployment with OpenAI ChatGPT

### Important Security Note
⚠️ **The OpenAI API key must NEVER be exposed in client-side JavaScript code.**

### Recommended Architecture

For production deployment, you should implement a backend API endpoint that:

1. **Backend API Endpoint** (e.g., `/api/chat`)
   - Receives user messages from the frontend
   - Securely stores the OpenAI API key in environment variables
   - Makes requests to OpenAI's ChatGPT API
   - Returns responses to the frontend

2. **Example Backend Implementation** (Node.js/Express):

```javascript
// backend/api/chat.js
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    
    // System prompt for AnomFIN context
    const systemPrompt = {
      role: 'system',
      content: `You are an AI assistant for AnomFIN, a Finnish company that provides:
      
      1. Custom application development for all platforms (mobile, desktop, web)
      2. Cybersecurity services including:
         - PhishHunterAI™ - phishing detection
         - SMS Shield™ - SMS fraud protection
         - M365/Google hardening and monitoring
         - 24/7 monitoring and incident response
      
      3. Three pricing packages:
         - Start (690€/month): Initial audit, basic hardening, training
         - Protect (1490€/month): Start + 24/7 monitoring, monthly reports
         - Elite (3490€/month): Protect + 1h SLA, advanced automation
      
      Contact: info@anomfin.fi, +358 40 123 4567
      
      Respond in Finnish. Be helpful, professional, and focus on promoting AnomFIN's services.`
    };
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview', // or 'gpt-4' for GPT-4.1
      messages: [systemPrompt, ...messages],
      temperature: 0.7,
      max_tokens: 500
    });
    
    res.json({
      message: completion.choices[0].message.content
    });
    
  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({
      error: 'Chat service temporarily unavailable'
    });
  }
});

module.exports = router;
```

3. **Frontend Update** (js/script.js):

Replace the `simulateChatGPTResponse()` function with an actual API call:

```javascript
// Send message to ChatGPT API via backend
async function sendMessageToAPI(message) {
    // Add user message to history
    conversationHistory.push({
        role: 'user',
        content: message
    });
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: conversationHistory
            })
        });
        
        if (!response.ok) {
            throw new Error('API request failed');
        }
        
        const data = await response.json();
        const assistantMessage = data.message;
        
        // Add assistant response to history
        conversationHistory.push({
            role: 'assistant',
            content: assistantMessage
        });
        
        return assistantMessage;
        
    } catch (error) {
        console.error('Chat API Error:', error);
        return 'Pahoittelen, mutta en voi vastata juuri nyt. Ota yhteyttä suoraan: info@anomfin.fi';
    }
}
```

### Environment Variables

Create a `.env` file (add to `.gitignore`):

```
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### Deployment Considerations

1. **Rate Limiting**: Implement rate limiting to prevent API abuse
2. **Cost Monitoring**: Monitor OpenAI API usage and costs
3. **Error Handling**: Graceful fallbacks when API is unavailable
4. **Conversation Limits**: Set maximum conversation length to control costs
5. **CORS Configuration**: Ensure proper CORS headers for API requests
6. **Session Management**: Consider implementing session/user tracking for conversation continuity

### Alternative: Client-Side with Proxy

If you prefer a simpler setup, you can use a serverless function (e.g., Vercel, Netlify, AWS Lambda):

```javascript
// api/chat.js (Vercel Serverless Function)
import OpenAI from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  
  // ... rest of the implementation
}
```

## Testing the Integration

1. Test with various user queries
2. Verify conversation context is maintained
3. Check error handling when API is unavailable
4. Monitor response times and user experience
5. Test on mobile and desktop devices

## Current Features

✅ Fully responsive chat UI
✅ Smooth animations and transitions
✅ Context-aware simulated responses
✅ Typing indicator
✅ Message history
✅ Open/close functionality
✅ Integration with scroll companion
✅ Accessible with ARIA labels

## Next Steps for Production

1. Set up backend API endpoint
2. Obtain OpenAI API key
3. Configure environment variables
4. Update frontend to use real API
5. Implement rate limiting
6. Add analytics tracking
7. Monitor and optimize costs

## Support

For questions about this integration, contact the development team or refer to:
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Chat Completions Guide](https://platform.openai.com/docs/guides/chat)
