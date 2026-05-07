const Anthropic = require('@anthropic-ai/sdk');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const { type, context } = JSON.parse(event.body);
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    if (type === 'suggestions') {
      const { date, calendarEvents, goals, priorities, yesterdaySummary } = context;

      const now = new Date(date);
      const europeDate = new Date(goals.europeDate);
      const gradDate = new Date(goals.graduationDate);
      const daysEurope = Math.ceil((europeDate - now) / 86400000);
      const daysGrad = Math.ceil((gradDate - now) / 86400000);

      const prompt = `You are Connor's personal AI operations assistant. Generate his morning briefing suggestions.

CONTEXT:
- Date: ${date}
- Europe trip: ${daysEurope} days away (${goals.europeDate})
- Graduation: ${daysGrad} days away (${goals.graduationDate})
- Daily goals: ${goals.calories} calories, ${goals.protein}g protein

STANDING PRIORITIES:
${priorities.map(p => `- ${p.cat}: ${p.text}`).join('\n')}

TODAY'S CALENDAR:
${calendarEvents && calendarEvents.length > 0
  ? calendarEvents.map(e => `- ${e.start ? new Date(e.start).toLocaleTimeString('en-US', {hour:'numeric',minute:'2-digit'}) : 'All day'}: ${e.name}`).join('\n')
  : '- No events loaded'}

YESTERDAY'S SUMMARY:
${yesterdaySummary && yesterdaySummary.length > 0
  ? yesterdaySummary.map(i => `- [${i.done ? 'DONE' : 'MISSED'}] ${i.text}`).join('\n')
  : '- No data yet'}

Generate exactly 5 suggestions and 4 end-of-day questions.

Return ONLY valid JSON, no markdown, no explanation:
{
  "suggestions": [
    { "text": "...", "source": "category · subcategory" }
  ],
  "eod_questions": ["question 1", "question 2", "question 3", "question 4"]
}

Suggestions should be:
- Specific and actionable, not generic
- Aware of what's on his calendar today
- Aware of what he missed yesterday (if anything)
- Tied to his real goals (abs, Cason Digital, Europe, graduation)
- Blunt and direct, like a personal coach
- Source format: "fitness · carryover" or "business · daily" or "travel · urgent"`;

      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }]
      });

      const raw = message.content[0].text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(raw);

      return { statusCode: 200, headers, body: JSON.stringify(parsed) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown type' }) };

  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
