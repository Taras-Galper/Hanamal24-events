// Serverless function to submit leads to Airtable
// This can be deployed to Vercel, Netlify Functions, or similar platforms

const AIRTABLE_BASE_ID = 'appeW41fJAbVdeWoU';
const AIRTABLE_TABLE_ID = 'tblTMBjuWZ8BATqTj';

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the request body
    const leadData = JSON.parse(event.body);
    
    // Validate required fields
    const requiredFields = ['fullName', 'email', 'phone', 'eventType', 'guestCount', 'eventDate'];
    const missingFields = requiredFields.filter(field => !leadData[field]);
    
    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields', 
          missingFields 
        })
      };
    }

    // Format data for Airtable
    const airtableData = {
      fields: {
        'שם מלא': leadData.fullName,
        'אימייל': leadData.email,
        'טלפון': leadData.phone,
        'סוג אירוע': leadData.eventType,
        'מספר אורחים': leadData.guestCount,
        'תאריך האירוע': leadData.eventDate,
        'הודעה נוספת': leadData.message || '',
        'תאריך יצירת הליד': new Date().toISOString().split('T')[0],
        'סטטוס': 'חדש',
        'מקור': 'אתר אינטרנט'
      }
    };

    // Submit to Airtable
    const airtableResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(airtableData)
    });

    if (!airtableResponse.ok) {
      const errorText = await airtableResponse.text();
      console.error('Airtable API error:', errorText);
      throw new Error(`Airtable API error: ${airtableResponse.status}`);
    }

    const result = await airtableResponse.json();
    console.log('Lead submitted successfully:', result);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Lead submitted successfully',
        leadId: result.id 
      })
    };

  } catch (error) {
    console.error('Error submitting lead:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};
