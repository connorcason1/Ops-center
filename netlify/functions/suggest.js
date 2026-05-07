const Anthropic = require('@anthropic-ai/sdk');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  try {
    const { type, context } = JSON.parse(event.body);
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    if (type === 'full') {
      const { date, calendarEvents, goals, priorities, yesterdaySummary } = context;
      const now = new Date(date);
      const dEurope = Math.ceil((new Date(goals.europeDate) - now) / 86400000);
      const dGrad = Math.ceil((new Date(goals.graduationDate) - now) / 86400000);

      // Fetch news headlines from RSS
      let newsHeadlines = [];
      try {
        const rssRes = await fetch('https://feeds.a.dj.com/rss/RSSMarketsMain.xml');
        const xml = await rssRes.text();
        const matches = [...xml.matchAll(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/gs)];
        newsHeadlines = matches.slice(1, 7).map(m => m[1].replace(/<[^>]*>/g, '').trim()).filter(Boolean);
      } catch(e) {
        try {
          const r2 = await fetch('https://feeds.content.dowjones.io/public/rss/mw_topstories');
          const xml = await r2.text();
          const matches = [...xml.matchAll(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/gs)];
          newsHeadlines = matches.slice(1, 7).map(m => m[1].replace(/<[^>]*>/g, '').trim()).filter(Boolean);
        } catch(e2) { newsHeadlines = []; }
      }

      const prompt = `You are Connor's personal AI ops assistant. Generate his daily briefing content.

ABOUT CONNOR:
- College senior, graduating May 22, then FSU for Finance
- Running Cason Digital (his business)
- Goal: visible abs before Europe trip June 1
- Daily targets: ${goals.calories} cal, ${goals.protein}g protein
- Europe: ${dEurope} days away | Graduation: ${dGrad} days away

TODAY'S CALENDAR:
${calendarEvents && calendarEvents.length > 0 ? calendarEvents.map(e => `- ${e.name}`).join('\n') : '- No events'}

YESTERDAY:
${yesterdaySummary && yesterdaySummary.length > 0 ? yesterdaySummary.map(i => `- [${i.done ? 'DONE' : 'MISSED'}] ${i.text}`).join('\n') : '- No data'}

Return ONLY valid JSON, no markdown:
{
  "suggestions": [
    {"text": "specific actionable suggestion", "source": "category · type"}
  ],
  "mission": "one punchy sentence — his singular focus for today",
  "eod_questions": ["question 1", "question 2", "question 3", "question 4"],
  "news": ${newsHeadlines.length > 0 ? JSON.stringify(newsHeadlines) : '[]'}
}

Rules:
- 5 suggestions, blunt and specific like a coach, tied to his real life
- Mission: one sentence, no fluff, makes him want to attack the day
- EOD questions: specific to what's on his calendar today
- News: return the array as-is from what I provided above`;

      const msg = await client.messages.create({
        model: 'claude-sonnet-4-5', max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      });

      const raw = msg.content[0].text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(raw);
      if (newsHeadlines.length > 0 && (!parsed.news || !parsed.news.length)) {
        parsed.news = newsHeadlines;
      }

      return { statusCode: 200, headers, body: JSON.stringify(parsed) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown type' }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
