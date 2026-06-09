import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function mapApiError(response: Response, errBody: { error?: { status?: string } }) {
  const status = errBody?.error?.status;
  if (status === 'UNAUTHENTICATED' || response.status === 401) {
    return 'INVALID_API_KEY';
  }
  if (status === 'RESOURCE_EXHAUSTED' || response.status === 429) {
    return 'QUOTA_EXCEEDED';
  }
  return 'API_ERROR';
}

function buildAnalysisPrompt(
  transactions: { date: string; description: string; amount: number }[],
  userContext: { salary: number; fixedExpenses: number; groceries: number; leisure: number },
) {
  return `You are a personal finance assistant analyzing Spanish bank transactions.
Return ONLY valid JSON matching this exact schema, no additional text.

User context:
- Monthly net salary: ${userContext.salary}€
- Budgeted fixed expenses: ${userContext.fixedExpenses}€/month
- Budgeted groceries: ${userContext.groceries}€/month  
- Budgeted leisure: ${userContext.leisure}€/month

Transactions (anonymized, ${transactions.length} records):
${JSON.stringify(transactions)}

Required JSON schema:
{
  "summary": {
    "totalExpenses": number,
    "totalIncome": number,
    "periodFrom": "YYYY-MM",
    "periodTo": "YYYY-MM",
    "numTransactions": number,
    "monthlyAverageExpense": number
  },
  "categories": [{
    "name": string,
    "amount": number,
    "percentage": number,
    "transactionCount": number,
    "examples": [string]
  }],
  "subscriptions": [{
    "name": string,
    "monthlyAmount": number,
    "frequency": "monthly"|"quarterly"|"yearly",
    "lastCharge": "YYYY-MM",
    "estimatedYearlyTotal": number,
    "confidence": "high"|"medium"|"low"
  }],
  "anomalies": [{
    "type": "duplicate"|"price_increase"|"unusual_amount"|"foreign_currency",
    "description": string,
    "amount": number,
    "date": "YYYY-MM"
  }],
  "insights": [{
    "type": "savings_opportunity"|"spending_pattern"|"budget_comparison"|"recommendation",
    "title": string,
    "description": string,
    "impactEuros": number|null
  }],
  "budgetComparison": {
    "groceries":     { "budgeted": number, "actual": number },
    "leisure":       { "budgeted": number, "actual": number },
    "housing":       { "budgeted": number, "actual": number },
    "transport":     { "budgeted": number, "actual": number },
    "subscriptions": { "budgeted": number, "actual": number }
  }
}

Category names to use (in Spanish for display):
Alimentación, Restaurantes y ocio, Transporte, Vivienda y hogar,
Salud y farmacia, Compras online, Suscripciones, Seguros,
Educación, Viajes, Transferencias, Otros

Detect subscriptions: recurring charges with same origin 
and similar amount (+/- 5%) at regular intervals.
Detect anomalies: same-day duplicates, unusually high amounts,
foreign currency charges, price increases vs previous month.
Insights must be specific and actionable, with real euro amounts.`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiApiKey) {
    return new Response(JSON.stringify({ error: 'NOT_CONFIGURED' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { transactions, userContext } = await req.json();
  if (!Array.isArray(transactions) || !transactions.length || !userContext) {
    return new Response(JSON.stringify({ error: 'INVALID_REQUEST' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const prompt = buildAnalysisPrompt(transactions, userContext);

  const response = await fetch(
    `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      }),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const code = mapApiError(response, err);
    return new Response(JSON.stringify({ error: code }), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  try {
    const parsed = JSON.parse(text);
    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'PARSE_ERROR' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
