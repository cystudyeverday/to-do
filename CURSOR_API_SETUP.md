# Cursor API Setup Guide

## Overview

This application now supports advanced AI-powered task extraction using the Cursor API. This provides much better results compared to the local extraction method.

## Features

- **Advanced AI Analysis**: Uses GPT-4, Claude-3, and other powerful AI models
- **Smart Task Classification**: Automatically categorizes tasks as Features or Issues
- **Detailed Descriptions**: Generates comprehensive task descriptions
- **High Accuracy**: Much better extraction results than local methods
- **Multiple Models**: Support for different AI models with different capabilities

## Setup Instructions

### 1. Get Cursor API Key

1. Visit [Cursor API](https://cursor.sh/api)
2. Sign up for an account
3. Generate an API key
4. Copy the API key

### 2. Configure API Key

#### Option A: Environment Variable (Recommended for Production)

Create a `.env.local` file in the project root:

```bash
CURSOR_API_KEY=your_cursor_api_key_here
```

#### Option B: In-App Configuration (Development)

1. Go to the Smart Add page
2. Select "Cursor AI" as the extraction method
3. Click "Configure API"
4. Enter your API key
5. Test the connection
6. Save the configuration

### 3. Usage

1. Navigate to the Smart Add page
2. Select "Cursor AI" as the extraction method
3. Choose your preferred AI model:
   - **GPT-4**: Most capable, best for complex tasks
   - **GPT-3.5 Turbo**: Fast and cost-effective
   - **Claude-3**: Excellent for analysis and reasoning
   - **Claude-3.5 Sonnet**: Balanced performance and speed
4. Set the maximum number of tasks (1-15)
5. Enter your project description
6. Click "Generate with Cursor AI"

## Supported Models

| Model | Description | Best For |
|-------|-------------|----------|
| GPT-4 | Most capable model | Complex projects, detailed analysis |
| GPT-3.5 Turbo | Fast and cost-effective | Quick extraction, simple projects |
| Claude-3 | Excellent reasoning | Technical analysis, problem-solving |
| Claude-3.5 Sonnet | Balanced performance | General purpose, good accuracy |

## API Response Format

The Cursor API returns tasks in the following format:

```json
[
  {
    "title": "Implement User Authentication",
    "description": "Create a complete user authentication system with login, logout, and registration functionality. Include password hashing, JWT tokens, and session management.",
    "type": "Feature",
    "summary": "User auth system"
  },
  {
    "title": "Fix Login Performance Issue",
    "description": "Resolve slow login response times by optimizing database queries and implementing caching for user sessions.",
    "type": "Issue",
    "summary": "Login optimization"
  }
]
```

## Error Handling

The application handles various API errors:

- **Invalid API Key**: Shows configuration modal
- **Rate Limiting**: Displays appropriate error message
- **Network Issues**: Falls back to local extraction
- **API Unavailable**: Graceful degradation to other methods

## Cost Considerations

- Cursor API charges per token used
- GPT-4 is more expensive but more accurate
- GPT-3.5 Turbo is cost-effective for most use cases
- Monitor your usage in the Cursor dashboard

## Troubleshooting

### API Key Not Working
1. Verify the API key is correct
2. Check if the key has sufficient credits
3. Ensure the key is not expired
4. Test the connection in the app

### Poor Results
1. Try a different AI model
2. Provide more detailed project descriptions
3. Adjust the maximum tasks setting
4. Use more specific technical language

### Connection Issues
1. Check your internet connection
2. Verify Cursor API service status
3. Try again later if it's a temporary issue
4. Use local extraction as fallback

## Security Notes

- API keys are stored locally in browser storage
- Never commit API keys to version control
- Use environment variables for production
- Regularly rotate your API keys

## Support

For issues with the Cursor API:
- Check the [Cursor API Documentation](https://cursor.sh/api/docs)
- Contact Cursor support
- Use the local extraction method as fallback 