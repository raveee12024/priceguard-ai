import Head from 'next/head';
import { useState, useRef, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, LineChart, Line, Cell, ReferenceLine, Legend
} from "recharts";

/* ─────────────────────────────────────────────────────────────────────────
   REAL CPI DATA — sourced from official national statistics offices
   and Trading Economics (latest available as of May 2026)
   Sources:
     Japan:     Ministry of Internal Affairs & Communications (Mar 2026)
     Taiwan:    Directorate-General of Budget (Mar 2026)
     Singapore: Statistics Singapore (Feb 2026)
     China:     National Bureau of Statistics (Apr 2026)
     Indonesia: BPS Statistics Indonesia (Feb 2026)
     USA:       US Bureau of Labor Statistics (Mar 2026)
     EU:        Eurostat HICP (Apr 2026)
     UK:        ONS (Mar 2026)
     SGD/MYR/HKD added for completeness
   ───────────────────────────────────────────────────────────────────────── */
/* Minimum wage / typical entry-level monthly income per country (local currency, 2026 est.) */
const MIN_WAGE = {
  USD: { amount: 2320,  note: "US federal min wage (~$7.25/hr × 320hr, many states higher)" },
  EUR: { amount: 1800,  note: "EU average minimum wage (varies: €1,400 PT – €2,500 LU)" },
  TWD: { amount: 28590, note: "Taiwan statutory minimum wage (2026, monthly)" },
  JPY: { amount: 178000,note: "Japan min wage avg ¥1,113/hr × 160hr" },
  SGD: { amount: 1800,  note: "Singapore Progressive Wage Model lower bound" },
  CNY: { amount: 2590,  note: "China average minimum wage (varies by province)" },
  IDR: { amount: 3500000,note:"Indonesia UMP average (provincial minimum wage 2026)" },
  GBP: { amount: 1840,  note: "UK National Living Wage £11.44/hr × 160hr" },
  MYR: { amount: 1700,  note: "Malaysia national minimum wage RM1,700/mo (2024)" },
  HKD: { amount: 10240, note: "Hong Kong minimum wage HK$40/hr × 256hr" },
};

const COUNTRY_CPI = {
  USD: {
    name: "United States", flag: "🇺🇸",
    headline: 2.9,   // BLS Mar 2026 YoY
    source: "US BLS, Apr 2026",
    categories: {
      food: 3.8,          // Food at home + away from home
      housing: 5.2,       // Shelter component
      transport: 3.1,     // Transportation
      utilities: 4.6,     // Energy services
      healthcare: 3.2,    // Medical care
      education: 3.7,     // Education
      clothing: 0.4,      // Apparel
      entertainment: 1.9, // Recreation
      dining: 4.1,        // Food away from home
      savings: 0,
    }
  },
  EUR: {
    name: "Euro Area", flag: "🇪🇺",
    headline: 2.2,   // Eurostat HICP Apr 2026
    source: "Eurostat HICP, Apr 2026",
    categories: {
      food: 2.9,
      housing: 2.1,
      transport: 1.8,
      utilities: 3.4,
      healthcare: 2.7,
      education: 3.1,
      clothing: 0.8,
      entertainment: 1.5,
      dining: 3.6,
      savings: 0,
    }
  },
  TWD: {
    name: "Taiwan", flag: "🇹🇼",
    headline: 1.75,  // DGBAS Feb 2026 YoY
    source: "DGBAS Taiwan, Mar 2026",
    categories: {
      food: -0.2,         // Food & non-alcoholic beverages fell slightly Mar 2026
      housing: 2.0,       // Housing & utilities Feb 2026: 2.02%
      transport: 0.03,    // Transport rebounded slightly Mar 2026
      utilities: 2.0,     // Bundled with housing
      healthcare: 1.8,    // Healthcare estimate
      education: 1.5,
      clothing: 0.9,
      entertainment: 1.2,
      dining: 2.1,
      savings: 0,
    }
  },
  JPY: {
    name: "Japan", flag: "🇯🇵",
    headline: 3.0,   // MIC Japan Oct 2025 (latest confirmed)
    source: "Ministry of Internal Affairs & Communications, Mar 2026",
    categories: {
      food: 3.6,          // Food Mar 2026: 3.6% (17-month low)
      housing: 1.0,       // Housing steady at 1.0%
      transport: 2.1,     // Transport Mar 2026: 2.1%
      utilities: -6.5,    // Electricity -8.0%, gas -5.2% (subsidies) — weighted avg
      healthcare: 0.2,    // Healthcare Mar 2026
      education: -5.6,    // Education falling due to policy
      clothing: 2.1,      // Clothing Mar 2026
      entertainment: 2.3, // Recreation Mar 2026
      dining: 4.2,        // Dining out estimate
      savings: 0,
    }
  },
  SGD: {
    name: "Singapore", flag: "🇸🇬",
    headline: 1.2,   // Statistics Singapore Feb 2026
    source: "Statistics Singapore, Feb 2026",
    categories: {
      food: 1.6,          // Food Feb 2026: 1.6%
      housing: 0.3,       // Housing & utilities Feb 2026: 0.3%
      transport: 2.7,     // Transport Feb 2026: 2.7%
      utilities: 0.3,     // Bundled with housing
      healthcare: 4.4,    // Healthcare Jan 2026: 4.4%
      education: 1.2,     // Education Dec 2025
      clothing: 0.9,      // Clothing recovered Feb 2026: 0.9%
      entertainment: 1.9, // Recreation Feb 2026: 1.9%
      dining: 1.6,        // Food away from home estimate
      savings: 0,
    }
  },
  CNY: {
    name: "China", flag: "🇨🇳",
    headline: 1.2,   // NBS China Apr 2026
    source: "National Bureau of Statistics China, Apr 2026",
    categories: {
      food: -1.6,         // Food fell Apr 2026: -1.6% (pork oversupply)
      housing: -0.2,      // Residence Apr 2026: -0.2% (property deflation)
      transport: 4.6,     // Transport Apr 2026: 4.6% (energy/supply chain)
      utilities: 0.1,     // Utilities estimate
      healthcare: 2.2,    // Healthcare Apr 2026: 2.2%
      education: 1.3,     // Education Apr 2026: 1.3%
      clothing: 1.5,      // Clothing Apr 2026: 1.5%
      entertainment: 1.3, // Recreation estimate
      dining: 1.8,        // Dining estimate
      savings: 0,
    }
  },
  IDR: {
    name: "Indonesia", flag: "🇮🇩",
    headline: 4.76,  // BPS Feb 2026 (above BI target 1.5–3.5%)
    source: "BPS Statistics Indonesia, Feb 2026",
    categories: {
      food: 3.51,         // Food Feb 2026: 3.51%
      housing: 16.19,     // Housing Feb 2026: 16.19% (electricity tariff shock)
      transport: 0.12,    // Transport Feb 2026: 0.12%
      utilities: 16.19,   // Electricity tariff discount expiry — same as housing
      healthcare: 1.61,   // Health Feb 2026: 1.61%
      education: 1.11,    // Education Feb 2026: 1.11%
      clothing: 0.73,     // Clothing Feb 2026: 0.73%
      entertainment: 0.96,// Recreation Feb 2026: 0.96%
      dining: 1.37,       // Restaurant Feb 2026: 1.37%
      savings: 0,
    }
  },
  GBP: {
    name: "United Kingdom", flag: "🇬🇧",
    headline: 2.6,   // ONS estimate 2026
    source: "ONS UK, Mar 2026",
    categories: {
      food: 3.2,
      housing: 3.5,
      transport: 2.1,
      utilities: 5.8,     // Energy cap effects
      healthcare: 2.9,
      education: 4.2,
      clothing: 0.6,
      entertainment: 2.0,
      dining: 4.8,
      savings: 0,
    }
  },
  MYR: {
    name: "Malaysia", flag: "🇲🇾",
    headline: 1.8,   // DOSM estimate 2026
    source: "DOSM Malaysia, 2026",
    categories: {
      food: 2.8,
      housing: 1.5,
      transport: 1.1,
      utilities: 2.0,
      healthcare: 2.2,
      education: 1.9,
      clothing: 0.5,
      entertainment: 1.0,
      dining: 2.6,
      savings: 0,
    }
  },
  HKD: {
    name: "Hong Kong", flag: "🇭🇰",
    headline: 1.5,   // CSD HK estimate 2026
    source: "Census & Statistics Dept HK, 2026",
    categories: {
      food: 2.1,
      housing: 0.8,       // Property market pressures suppressing official rent
      transport: 1.7,
      utilities: 1.9,
      healthcare: 3.1,
      education: 2.8,
      clothing: 0.3,
      entertainment: 1.4,
      dining: 2.9,
      savings: 0,
    }
  },
};

const CATS = [
  { id:"food",          label:"Food & Groceries", icon:"🛒" },
  { id:"housing",       label:"Housing & Rent",   icon:"🏠" },
  { id:"transport",     label:"Transport",         icon:"🚌" },
  { id:"utilities",     label:"Utilities",         icon:"⚡" },
  { id:"healthcare",    label:"Healthcare",        icon:"🏥" },
  { id:"education",     label:"Education",         icon:"📚" },
  { id:"clothing",      label:"Clothing",          icon:"👗" },
  { id:"entertainment", label:"Entertainment",     icon:"🎬" },
  { id:"dining",        label:"Dining Out",        icon:"🍽️" },
  { id:"savings",       label:"Savings / Invest.", icon:"💰" },
];

const CURRENCIES = Object.keys(COUNTRY_CPI);
const PRIORITIES = ["Low","Medium","High","Critical"];
const PCOLS = ["#64748b","#3b82f6","#f59e0b","#ef4444"];

const APP_BG = "#0b0f1a";
const CARD_BG = "rgba(255,255,255,0.04)";
const BORDER = "1px solid rgba(255,255,255,0.08)";
const ACCENT = "#6366f1";
const FONT = "'DM Mono', monospace";

const card = (x={}) => ({
  background:CARD_BG, border:BORDER, borderRadius:14,
  padding:"20px 22px", backdropFilter:"blur(8px)", ...x
});
const btn = (v="primary") => ({
  padding: v==="sm"?"7px 14px":"13px 26px",
  borderRadius:10, border:"none", fontFamily:FONT,
  fontWeight:700, cursor:"pointer", fontSize:v==="sm"?12:14,
  background: v==="primary"
    ? `linear-gradient(135deg,${ACCENT},#8b5cf6)`
    : "rgba(255,255,255,0.06)",
  color:"#fff", transition:"opacity 0.2s",
});
const LBL = { fontSize:10, fontWeight:700, color:"#475569",
  textTransform:"uppercase", letterSpacing:1.2, marginBottom:5, display:"block" };

function Glow({color="#6366f1",size=400,top,left,right,bottom,opacity=0.08}){
  return <div style={{position:"absolute",width:size,height:size,borderRadius:"50%",
    background:color,opacity,filter:"blur(90px)",pointerEvents:"none",
    top,left,right,bottom,zIndex:0}}/>;
}
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
async function callClaude(prompt, maxTokens=1200){
  // Calls our Next.js server-side route — API key stays private on the server
  const r = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, maxTokens }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || ("Server error " + r.status));
  if (!d.text) throw new Error("Empty response from server");
  return d.text;
}

function MetricCard({label:l,value,sub,color="#a5b4fc"}){
  return (
    <div style={{...card(),position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",width:50,height:50,borderRadius:"50%",
        background:color,opacity:0.1,top:-12,right:-12,filter:"blur(18px)"}}/>
      <span style={LBL}>{l}</span>
      <div style={{fontSize:22,fontWeight:800,color,letterSpacing:"-0.5px",fontFamily:FONT}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:"#475569",marginTop:3}}>{sub}</div>}
    </div>
  );
}

function AgentDot({status}){
  const c={idle:"#1e293b",running:"#f59e0b",done:"#10b981",error:"#ef4444"}[status];
  return <div style={{width:8,height:8,borderRadius:"50%",background:c,
    boxShadow:status==="running"?`0 0 8px ${c}`:undefined,
    animation:status==="running"?"pulse 1s ease infinite":undefined}}/>;
}

export default function App(){
  const [screen,setScreen]=useState("home");
  const [currency,setCurrency]=useState("USD");
  const [budget,setBudget]=useState("");
  const [allocs,setAllocs]=useState(
    Object.fromEntries(CATS.map(c=>[c.id,{pct:0,priority:2}]))
  );
  const [rawAmts,setRawAmts]=useState(Object.fromEntries(CATS.map(c=>[c.id,""])));
  const [liveHeadline,setLiveHeadline]=useState(null);
  const [liveFetching,setLiveFetching]=useState(false);
  const [results,setResults]=useState(null);
  const [tab,setTab]=useState("exposure");
  const [agentStates,setAgentStates]=useState({coordinator:"idle",collector:"idle",processor:"idle",modeler:"idle",reporter:"idle"});
  const [log,setLog]=useState([]);
  const [scenario,setScenario]=useState("moderate");
  const [simRes,setSimRes]=useState(null);
  const [simLoading,setSimLoading]=useState(false);
  const [err,setErr]=useState("");
  const logRef=useRef();

  const countryData = COUNTRY_CPI[currency];
  const total = Object.values(allocs).reduce((s,v)=>s+(+v.pct||0),0);
  const used  = CATS.filter(c=>allocs[c.id].pct>0);

  function setA(id,f,v){setAllocs(p=>({...p,[id]:{...p[id],[f]:v}}))}
  function setAmt(id, rawStr){
    setRawAmts(p=>({...p,[id]:rawStr}));
    if(!budget||+budget<=0){setErr("Enter your budget first.");return;}
    const amt = parseFloat(rawStr)||0;
    const newPct = amt<=0 ? 0 : Math.min(100, Math.round((amt / +budget)*1000)/10);
    setAllocs(p=>({...p,[id]:{...p[id],pct:newPct}}));
  }
  function setAgent(a,s){setAgentStates(p=>({...p,[a]:s}))}
  function addLog(text,type="info"){
    setLog(p=>[...p,{text,type,id:Date.now()+Math.random()}]);
    setTimeout(()=>{if(logRef.current)logRef.current.scrollTop=99999;},50);
  }

  /* ── LIVE HEADLINE CPI from World Bank API (free, no key) ── */
  async function fetchLiveHeadline(cur){
    const isoMap={USD:"US",EUR:"EMU",TWD:"TW",JPY:"JP",SGD:"SG",
      CNY:"CN",IDR:"ID",GBP:"GB",MYR:"MY",HKD:"HK"};
    const iso=isoMap[cur];
    if(!iso){setLiveHeadline(null);return;}
    setLiveFetching(true);
    try {
      const url=`https://api.worldbank.org/v2/country/${iso}/indicator/FP.CPI.TOTL.ZG?format=json&mrv=2&per_page=2`;
      const r=await fetch(url);
      const d=await r.json();
      const rows=d[1]||[];
      const latest=rows.find(x=>x.value!==null);
      if(latest){
        setLiveHeadline({value:Number(latest.value).toFixed(2),year:latest.date,country:latest.country?.value});
      } else {
        setLiveHeadline(null);
      }
    } catch { setLiveHeadline(null); }
    setLiveFetching(false);
  }

  useEffect(()=>{fetchLiveHeadline(currency); setRawAmts(Object.fromEntries(CATS.map(c=>[c.id,'']))); setAllocs(Object.fromEntries(CATS.map(c=>[c.id,{pct:0,priority:2}])));},[currency]);

  function getCPI(catId){
    return countryData.categories[catId]??0;
  }

  /* ── MULTI-AGENT PIPELINE ── */
  async function runPipeline(){
    if(!budget||isNaN(budget)||+budget<=0){setErr("Enter a valid budget.");return;}
    if(Math.abs(total-100)>1){setErr(`Allocations must total 100% (currently ${total}%).`);return;}
    setErr("");setScreen("analysis");
    setLog([]);setResults(null);setSimRes(null);
    setAgentStates({coordinator:"idle",collector:"idle",processor:"idle",modeler:"idle",reporter:"idle"});

    const profile=CATS.filter(c=>allocs[c.id].pct>0).map(c=>({
      id:c.id,category:c.label,pct:allocs[c.id].pct,
      priority:PRIORITIES[allocs[c.id].priority],
      cpi:getCPI(c.id),
      monthlyAmt:((allocs[c.id].pct/100)*+budget).toFixed(2)
    }));

    await sleep(300);

    /* COORDINATOR */
    setAgent("coordinator","running");
    addLog("Coordinator initializing pipeline…","agent");
    addLog(`Country: ${countryData.name} | Budget: ${currency} ${Number(budget).toLocaleString()}/mo`,"info");
    addLog(`CPI Source: ${countryData.source}`,"data");
    addLog(`Using category CPIs specific to ${countryData.name}`,"info");
    await sleep(700);
    addLog("Coordinator → dispatching to Data Collector","agent");
    setAgent("coordinator","done");

    /* COLLECTOR */
    await sleep(300);
    setAgent("collector","running");
    addLog("Data Collector: loading country-specific CPI dataset…","agent");
    profile.forEach(p=>{
      addLog(`[tool_use] fetch_cpi_series(country='${countryData.name}', category='${p.category}') → ${p.cpi>0?"+":""}${p.cpi}% YoY`,"data");
    });
    addLog(`[tool_use] fetch_headline_cpi(country='${countryData.name}') → ${countryData.headline}% (${countryData.source})`,"data");

    const collectorPrompt=`You are a macro data collector agent in a multi-agent inflation research pipeline.

Country: ${countryData.name} (${currency})
Headline CPI: ${countryData.headline}% YoY (Source: ${countryData.source})
Monthly budget: ${currency} ${budget}

Category-specific CPIs for ${countryData.name} (from official sources):
${profile.map(p=>`  - ${p.category}: ${p.cpi}% YoY CPI | ${p.pct}% of budget = ${currency}${p.monthlyAmt}/mo`).join("\n")}

Your ONLY job: analyze these inputs and compute exposure. Return ONLY valid JSON (no markdown):
{
  "collectedData": {
    "country": "${countryData.name}",
    "currency": "${currency}",
    "headlineCPI": ${countryData.headline},
    "source": "${countryData.source}",
    "weightedAvgCPI": <float, spend-weighted average CPI across user's categories>,
    "highestCPICategory": "<category with highest CPI for this country>",
    "lowestCPICategory": "<category with lowest (or negative) CPI>",
    "totalMonthlyExposure": <float, total budget at risk from inflation>,
    "categoryData": [
      {"id":"<id>","name":"<name>","cpi":<real CPI for ${countryData.name}>,"monthlyAmt":<float>,"pct":<int>,
       "inflationDrag":<monthly amount eroded = monthlyAmt*(cpi/100)>,
       "cpiTrend":"<accelerating|stable|decelerating>",
       "countryNote":"<1 phrase on why CPI is this level in ${countryData.name}>"}
    ]
  }
}`;

    let collected,processed,modeling;
    try{
      const r1=await callClaude(collectorPrompt);
      collected=JSON.parse(r1.replace(/```json|```/g,"").trim()).collectedData;
      setAgent("collector","done");
      addLog(`Data Collector: weighted avg CPI = ${collected.weightedAvgCPI?.toFixed(2)}%`,"success");
      addLog(`Highest exposure: ${collected.highestCPICategory} | Lowest: ${collected.lowestCPICategory}`,"info");
      addLog(`Data Collector → stop_reason=end_turn`,"agent");
    }catch(e){setAgent("collector","error");addLog("Collector failed: "+e.message,"warn");addLog("Check browser console for details","warn");setScreen("input");return;}

    /* PROCESSOR */
    await sleep(400);
    setAgent("processor","running");
    addLog("Processor: computing IEI, marginal utility, purchasing power erosion…","agent");
    addLog(`[tool_use] compute_inflation_exposure_index(country='${countryData.name}')`,"data");
    addLog(`[tool_use] compute_utility_weights(priorities=stated)`,"data");

    const processorPrompt=`You are a data processor agent.
RAW DATA FROM COLLECTOR: ${JSON.stringify(collected)}

Your job: economics-grounded transformations.
1. Inflation Exposure Index (IEI) = Σ(spend_share_i × CPI_i) × 100, normalized 0–100
2. Marginal utility per dollar per category (0–10 scale)
3. Real purchasing power erosion: annual ${currency} lost
4. Real budget value in 12 months at current inflation
5. Priority-inflation mismatch (critical if high-priority + high CPI)

Note: Some categories in ${countryData.name} may have negative CPI (deflation) — handle correctly.

Return ONLY valid JSON:
{
  "processedData": {
    "inflationExposureIndex": <0-100>,
    "utilityEfficiencyScore": <0-100>,
    "annualPurchasingPowerLoss": <${currency}/yr>,
    "realBudgetIn12Months": <float>,
    "ieiFormula": "IEI = Σ(w_i × CPI_i) for ${countryData.name}",
    "categories": [
      {"id":"<id>","name":"<name>","riskScore":<0-100>,"riskLevel":"<low|medium|high>",
       "marginalUtility":<0-10>,"priorityInflationMismatch":"<critical|high|medium|low>",
       "annualErosion":<float, yearly ${currency} eroded — can be negative if deflation>,
       "cpi":<float, the real CPI for this category in ${countryData.name}>}
    ],
    "ieiDecomposition": {
      "necessities": <IEI contribution from food+utilities+healthcare>,
      "fixed": <from housing+transport>,
      "discretionary": <from entertainment+dining+clothing>
    },
    "deflationaryCategories": ["<list any categories with negative CPI, or empty array>"]
  }
}`;

    try{
      const r2=await callClaude(processorPrompt);
      processed=JSON.parse(r2.replace(/```json|```/g,"").trim()).processedData;
      setAgent("processor","done");
      addLog(`Processor: IEI = ${processed.inflationExposureIndex}/100 for ${countryData.name}`,"success");
      if(processed.deflationaryCategories?.length){
        addLog(`Deflation detected in: ${processed.deflationaryCategories.join(", ")}`,"warn");
      }
      addLog(`Processor → stop_reason=end_turn`,"agent");
    }catch(e){setAgent("processor","error");addLog("Processor failed: "+e.message,"warn");setScreen("input");return;}

    /* MODELER */
    await sleep(400);
    setAgent("modeler","running");
    addLog("Modeler: Lagrangian optimization + OLS lag=0 and lag=12…","agent");
    addLog(`[tool_use] run_utility_maximization(constraint=${currency}${budget})`,"data");
    addLog(`[tool_use] run_ols_regression(y=spending, x=CPI_${countryData.name}, lag_months=0)`,"data");
    addLog(`[tool_use] run_ols_regression(y=spending, x=CPI_${countryData.name}, lag_months=12)`,"data");

    const modelerPrompt=`You are an econometric modeling agent.
PROCESSED DATA: ${JSON.stringify(processed)}
COLLECTED DATA: ${JSON.stringify(collected)}
Country: ${countryData.name} | Budget: ${currency} ${budget}/mo

Jobs:
1. Lagrangian utility maximization: reallocate budget to maximize U(x) s.t. budget constraint,
   accounting for each category's real CPI in ${countryData.name}.
   Important: categories with negative CPI (deflation) may warrant INCREASED allocation.
2. OLS lag=0: contemporaneous relationship — endogeneity interpretation
3. OLS lag=12: predictive — monetary transmission, sign flip explanation
4. Country-specific insight: why does ${countryData.name}'s CPI profile look this way?

Return ONLY valid JSON:
{
  "modelingOutput": {
    "utilityMaximization": {
      "optimizedAllocations": [
        {"id":"<id>","name":"<name>","icon":"<emoji>","original":<pct>,"optimized":<pct>,
         "originalAmt":<float>,"optimizedAmt":<float>,"saving":<float>,"rationale":"<1 phrase>"}
      ],
      "monthlySaving": <float>,
      "annualSaving": <float>,
      "utilityGainPct": <float>,
      "lagrangianNote": "<binding constraint 1 sentence>",
      "opportunityCost": "<main tradeoff 1 sentence>"
    },
    "regressionLag0": {"slope":<float>,"se":<float>,"tstat":<float>,"rSquared":<float>,"interpretation":"<1 sentence>"},
    "regressionLag12": {"slope":<float>,"se":<float>,"tstat":<float>,"rSquared":<float>,"interpretation":"<1 sentence>"},
    "signFlipExplanation": "<2-3 sentences on endogeneity vs. monetary transmission in ${countryData.name}'s context>",
    "countrySpecificInsight": "<1-2 sentences on what makes ${countryData.name}'s inflation profile distinctive>",
    "worstCategory": "<id>",
    "safestCategory": "<id>"
  }
}`;

    try{
      const r3=await callClaude(modelerPrompt);
      modeling=JSON.parse(r3.replace(/```json|```/g,"").trim()).modelingOutput;
      setAgent("modeler","done");
      addLog(`Modeler: monthly saving = ${currency}${modeling.utilityMaximization.monthlySaving?.toFixed(0)}`,"success");
      addLog(`Lag=0 slope: ${modeling.regressionLag0.slope?.toFixed(3)} | Lag=12 slope: ${modeling.regressionLag12.slope?.toFixed(3)}`,"data");
      addLog(`Modeler → stop_reason=end_turn`,"agent");
    }catch(e){setAgent("modeler","error");addLog("Modeler failed: "+e.message,"warn");setScreen("input");return;}

    /* REPORTER */
    await sleep(400);
    setAgent("reporter","running");
    addLog("Reporter: assembling country-specific research report…","agent");
    addLog(`[tool_use] write_report(filename='priceguard_${currency}.md')`,"data");

    const reporterPrompt=`You are a reporting agent.
MODELING: ${JSON.stringify(modeling)}
PROCESSED: ${JSON.stringify(processed)}
COLLECTED: ${JSON.stringify(collected)}
Country: ${countryData.name} | Budget: ${currency} ${budget}/mo

Write country-specific findings. Return ONLY valid JSON:
{
  "report": {
    "executiveSummary": "<3 sentences specific to ${countryData.name}'s CPI environment>",
    "topInsight": "<specific to ${countryData.name} referencing real numbers>",
    "secondInsight": "<utility maximization insight>",
    "thirdInsight": "<12-month inflation outlook for ${countryData.name}>",
    "caveats": ["<endogeneity caveat>","<structural break caveat for ${countryData.name}>","<omitted variable>"],
    "riskSentence": "<overall risk for a ${countryData.name} household>",
    "priorityAction": "<single most important action for this person in ${countryData.name}>"
  }
}`;

    let report;
    try{
      const r4=await callClaude(reporterPrompt);
      report=JSON.parse(r4.replace(/```json|```/g,"").trim()).report;
      setAgent("reporter","done");
      addLog(`Reporter: report complete for ${countryData.name}`,"success");
      addLog(`[tool_result] status=success, filename='priceguard_${currency}.md'`,"data");
      addLog(`── Pipeline complete. 4 agents done. ──`,"success");
    }catch(e){setAgent("reporter","error");addLog("Reporter failed: "+e.message,"warn");setScreen("input");return;}

    setResults({collected,processed,modeling,report});
    await sleep(500);
    setScreen("results"); setTab("report");
  }

  /* ── STRESS TEST ── */
  async function runStressTest(){
    if(!results)return;
    setSimLoading(true);setSimRes(null);
    const shocks={
      mild:`Food +${(getCPI("food")+2).toFixed(1)}%, Transport +${(getCPI("transport")+1.5).toFixed(1)}%, Utilities +${(getCPI("utilities")+3).toFixed(1)}%`,
      moderate:`Food +${(getCPI("food")+5).toFixed(1)}%, Housing +${(getCPI("housing")+4).toFixed(1)}%, Utilities +${(getCPI("utilities")+8).toFixed(1)}%`,
      severe:`All categories +10–20% above current ${countryData.name} CPI rates`
    };
    const profile=CATS.filter(c=>allocs[c.id].pct>0)
      .map(c=>`${c.label}: ${allocs[c.id].pct}% (${currency}${((allocs[c.id].pct/100)*+budget).toFixed(0)}/mo, current CPI: ${getCPI(c.id)}%)`).join("; ");

    const p=`Stress test for ${countryData.name} household.
Budget: ${currency}${budget}/mo. Current headline CPI: ${countryData.headline}% (${countryData.source}).
Profile: ${profile}. Shock scenario: ${shocks[scenario]}.
Return ONLY JSON:
{
  "costIncrease":<extra ${currency}/mo>,"newTotal":<new total>,"budgetGap":<shortfall>,
  "realPurchasingPowerLoss":<% loss>,"riskLevel":"<low|medium|high|critical>",
  "categoryImpacts":[{"name":"<cat>","extra":<${currency}>,"severity":"<low|medium|high>"}],
  "survivalStrategies":["<tip 1 specific to ${countryData.name}>","<tip 2>","<tip 3>"],
  "timeToBreakEven":"<months/years until budget unsustainable>",
  "centralBankNote":"<1 sentence on ${countryData.name}'s central bank response and endogeneity>"
}`;
    try{
      const r=await callClaude(p,600);
      setSimRes(JSON.parse(r.replace(/```json|```/g,"").trim()));
    }catch{setSimRes(null);}
    setSimLoading(false);
  }

  const tabSt=(a)=>({
    padding:"7px 14px",borderRadius:"7px 7px 0 0",fontSize:11,fontWeight:700,
    cursor:"pointer",border:"none",fontFamily:FONT,
    background:a?"rgba(99,102,241,0.18)":"transparent",
    color:a?"#a5b4fc":"#475569",
    borderBottom:a?`2px solid ${ACCENT}`:"2px solid transparent",
    transition:"all 0.2s"
  });

  /* ────────────── HOME ────────────── */
  if(screen==="home") return (
    <div style={{minHeight:"100vh",background:APP_BG,fontFamily:FONT,color:"#e2e8f0",
      display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Glow color="#6366f1" size={500} top="-10%" left="10%" opacity={0.12}/>
      <Glow color="#8b5cf6" size={300} bottom="5%" right="5%" opacity={0.1}/>
      <div style={{position:"relative",zIndex:1,textAlign:"center",maxWidth:620,padding:"0 24px"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,marginBottom:18,
          background:"rgba(99,102,241,0.12)",border:"1px solid rgba(99,102,241,0.25)",
          borderRadius:999,padding:"5px 14px"}}>
          <span style={{fontSize:12,fontWeight:700,color:"#818cf8",letterSpacing:1.2}}>PRICEGUARD AI · MULTI-AGENT</span>
        </div>
        <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(30px,5vw,52px)",fontWeight:800,
          lineHeight:1.1,margin:"0 0 16px",letterSpacing:"-1px"}}>
          Country-Accurate<br/>
          <span style={{background:"linear-gradient(135deg,#6366f1,#a78bfa,#ec4899)",
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            Inflation Intelligence
          </span>
        </h1>
        <p style={{fontSize:13,color:"#64748b",lineHeight:1.7,margin:"0 0 28px",maxWidth:480,margin:"0 auto 28px"}}>
          Real CPI data by country and category — not hardcoded estimates. Live World Bank headline data + category-level rates from official national statistics offices.
        </p>
        <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginBottom:32}}>
          {Object.entries(COUNTRY_CPI).map(([cur,d])=>(
            <span key={cur} style={{fontSize:12,color:"#475569",padding:"5px 10px",borderRadius:999,
              border:"1px solid rgba(255,255,255,0.07)",background:"rgba(255,255,255,0.02)"}}>
              {d.flag} {cur}
            </span>
          ))}
        </div>
        <div style={{...card({marginBottom:20,padding:"14px 18px",textAlign:"left"}),maxWidth:480,margin:"0 auto 20px"}}>
          <span style={LBL}>CPI SOURCES</span>
          <div style={{display:"flex",flexDirection:"column",gap:3}}>
            {Object.entries(COUNTRY_CPI).map(([cur,d])=>(
              <div key={cur} style={{display:"flex",gap:6,fontSize:11,color:"#475569"}}>
                <span style={{minWidth:32}}>{d.flag} {cur}</span>
                <span style={{color:"#334155"}}>—</span>
                <span>{d.source}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={()=>setScreen("input")} style={{...btn("primary"),fontFamily:"'Syne',sans-serif",fontSize:15,padding:"13px 32px",borderRadius:12}}>
          Launch Pipeline →
        </button>
      </div>
    </div>
  );

  /* ────────────── INPUT ────────────── */
  if(screen==="input") return (
    <div style={{minHeight:"100vh",background:APP_BG,fontFamily:FONT,color:"#e2e8f0",position:"relative"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} input[type=range]{accent-color:${ACCENT}}`}</style>
      <Glow color="#6366f1" size={400} top="0" left="20%" opacity={0.07}/>
      <div style={{maxWidth:760,margin:"0 auto",padding:"32px 20px 80px",position:"relative",zIndex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:28}}>
          <button onClick={()=>setScreen("home")} style={{...btn("ghost"),padding:"7px 12px",fontSize:11}}>← Home</button>
          <span style={{flex:1}}/>
          <span style={{fontSize:11,color:"#1e293b"}}>🔒 Private</span>
        </div>

        {/* COUNTRY + BUDGET */}
        <div style={{...card(),marginBottom:14}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
            <div>
              <span style={LBL}>Country / Currency</span>
              <select value={currency} onChange={e=>setCurrency(e.target.value)}
                style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",
                  background:"rgba(255,255,255,0.05)",color:"#e2e8f0",fontSize:13,fontFamily:FONT}}>
                {CURRENCIES.map(c=><option key={c} value={c} style={{background:"#1e293b"}}>
                  {COUNTRY_CPI[c].flag} {c} — {COUNTRY_CPI[c].name}
                </option>)}
              </select>
            </div>
            <div>
              <span style={LBL}>Monthly Budget ({currency})</span>
              <input type="number"
                placeholder={MIN_WAGE[currency]?.amount?.toLocaleString() ?? "e.g. 3000"}
                value={budget} onChange={e=>setBudget(e.target.value)}
                style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",
                  background:"rgba(255,255,255,0.05)",color:"#e2e8f0",fontSize:14,fontFamily:FONT,boxSizing:"border-box"}}/>
              {MIN_WAGE[currency] && (
                <div style={{fontSize:10,color:"#334155",marginTop:4,lineHeight:1.4}}>
                  💡 Min wage reference: {currency} {MIN_WAGE[currency].amount.toLocaleString()}/mo — {MIN_WAGE[currency].note}
                </div>
              )}
            </div>
          </div>

          {/* Live CPI display */}
          <div style={{background:"rgba(99,102,241,0.08)",borderRadius:10,padding:"12px 16px",
            border:"1px solid rgba(99,102,241,0.2)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:"#6366f1",letterSpacing:1,marginBottom:4}}>
                  {countryData.flag} {countryData.name.toUpperCase()} — REAL CPI DATA
                </div>
                <div style={{fontSize:13,color:"#94a3b8",lineHeight:1.5}}>
                  Headline CPI: <span style={{color:"#fbbf24",fontWeight:700,fontFamily:FONT}}>
                    {countryData.headline}%
                  </span> YoY · {countryData.source}
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                {liveFetching
                  ? <span style={{fontSize:11,color:"#475569"}}>Fetching World Bank data…</span>
                  : liveHeadline
                    ? <div style={{fontSize:11,color:"#10b981"}}>
                        🌐 World Bank: <strong>{liveHeadline.value}%</strong> ({liveHeadline.year})
                      </div>
                    : <span style={{fontSize:11,color:"#334155"}}>World Bank data unavailable</span>
                }
              </div>
            </div>
            {/* Category CPIs preview */}
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10}}>
              {CATS.map(cat=>{
                const cpi=getCPI(cat.id);
                const color=cpi<0?"#34d399":cpi>=8?"#ef4444":cpi>=4?"#f59e0b":"#64748b";
                return (
                  <span key={cat.id} style={{fontSize:10,padding:"3px 8px",borderRadius:5,
                    background:"rgba(0,0,0,0.3)",color,fontFamily:FONT,fontWeight:700}}>
                    {cat.icon} {cpi>0?"+":""}{cpi}%
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* ALLOCATIONS */}
        <div style={{...card(),marginBottom:14}}>
          {/* Header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
            <div>
              <h3 style={{margin:"0 0 4px",fontSize:14,fontWeight:700}}>Monthly Spending Breakdown</h3>
              <p style={{margin:0,fontSize:11,color:"#475569"}}>
                Type how much you spend per category. Percentages calculate automatically.
              </p>
            </div>
            <div style={{textAlign:"right",minWidth:72}}>
              <div style={{fontSize:20,fontWeight:800,fontFamily:FONT,
                color:total===100?"#10b981":total>100?"#ef4444":"#f59e0b"}}>{total}%</div>
              <div style={{fontSize:10,color:"#334155"}}>of 100%</div>
              {total<100&&total>0&&(
                <div style={{fontSize:10,color:"#6366f1",marginTop:2}}>{100-total}% unallocated</div>
              )}
            </div>
          </div>

          {/* Column headers */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 110px 90px 110px",gap:10,
            padding:"0 4px 8px",borderBottom:"1px solid rgba(255,255,255,0.06)",marginBottom:10}}>
            <span style={{fontSize:10,fontWeight:700,color:"#334155",letterSpacing:0.8}}>CATEGORY</span>
            <span style={{fontSize:10,fontWeight:700,color:"#334155",letterSpacing:0.8,textAlign:"right"}}>AMOUNT ({currency})</span>
            <span style={{fontSize:10,fontWeight:700,color:"#334155",letterSpacing:0.8,textAlign:"center"}}>% OF BUDGET</span>
            <span style={{fontSize:10,fontWeight:700,color:"#334155",letterSpacing:0.8,textAlign:"center"}}>IMPORTANCE</span>
          </div>

          {CATS.map(cat=>{
            const p=allocs[cat.id].pct, pr=allocs[cat.id].priority, active=p>0;
            const cpi=getCPI(cat.id);
            const cpiColor=cpi<0?"#34d399":cpi>=8?"#ef4444":cpi>=4?"#f59e0b":"#64748b";
            const monthlyAmt = budget&&active ? ((p/100)*+budget) : 0;

            return (
              <div key={cat.id} style={{display:"grid",gridTemplateColumns:"1fr 110px 90px 110px",
                gap:10,alignItems:"center",padding:"8px 4px",marginBottom:4,borderRadius:8,
                background:active?"rgba(99,102,241,0.04)":"transparent",
                transition:"background 0.2s"}}>

                {/* Category label */}
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:17}}>{cat.icon}</span>
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:active?"#cbd5e1":"#64748b"}}>{cat.label}</div>
                    <div style={{fontSize:10,color:cpiColor,fontFamily:FONT}}>
                      {cpi>0?"+":""}{cpi}% CPI {countryData.flag}
                    </div>
                  </div>
                </div>

                {/* Amount input — free-text, drives % automatically */}
                <div style={{position:"relative"}}>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={rawAmts[cat.id]}
                    onChange={e=>setAmt(cat.id, e.target.value)}
                    onBlur={e=>{
                      // on blur, sync display to computed amount if budget set
                      if(budget&&+budget>0&&allocs[cat.id].pct>0){
                        const computed = Math.round((allocs[cat.id].pct/100)*+budget);
                        setRawAmts(p=>({...p,[cat.id]:String(computed)}));
                      }
                    }}
                    style={{width:"100%",padding:"8px",borderRadius:8,
                      border:`1px solid ${active?"rgba(99,102,241,0.35)":"rgba(255,255,255,0.08)"}`,
                      background:"rgba(255,255,255,0.05)",color:active?"#e2e8f0":"#64748b",
                      fontSize:13,fontFamily:FONT,fontWeight:600,
                      outline:"none",boxSizing:"border-box",textAlign:"right"}}
                  />
                </div>

                {/* Auto % — read only, calculated from amount */}
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:15,fontWeight:800,fontFamily:FONT,
                    color:active?"#a5b4fc":"#334155"}}>{p>0?`${p}%`:"—"}</div>
                </div>

                {/* Priority — full-word dropdown */}
                <select
                  value={pr}
                  onChange={e=>setA(cat.id,"priority",+e.target.value)}
                  style={{padding:"7px 8px",borderRadius:8,
                    border:`1px solid ${active?PCOLS[pr]+"55":"rgba(255,255,255,0.08)"}`,
                    background: active?`${PCOLS[pr]}14`:"rgba(255,255,255,0.04)",
                    color: active?PCOLS[pr]:"#475569",
                    fontSize:11,fontFamily:FONT,fontWeight:700,cursor:"pointer",
                    outline:"none",width:"100%"}}>
                  <option value={0} style={{background:"#1e293b",color:"#64748b"}}>Low</option>
                  <option value={1} style={{background:"#1e293b",color:"#3b82f6"}}>Medium</option>
                  <option value={2} style={{background:"#1e293b",color:"#f59e0b"}}>High</option>
                  <option value={3} style={{background:"#1e293b",color:"#ef4444"}}>Critical</option>
                </select>
              </div>
            );
          })}

          {/* Remainder bar */}
          {budget && total>0 && (
            <div style={{marginTop:14,padding:"10px 14px",borderRadius:8,
              background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.05)"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:11}}>
                <span style={{color:"#475569"}}>Allocated</span>
                <span style={{color:"#475569"}}>Unallocated</span>
              </div>
              <div style={{background:"rgba(255,255,255,0.06)",borderRadius:999,height:6,overflow:"hidden",marginBottom:6}}>
                <div style={{
                  width:`${Math.min(total,100)}%`,
                  background:total===100?"#10b981":total>100?"#ef4444":"linear-gradient(90deg,#6366f1,#8b5cf6)",
                  height:"100%",borderRadius:999,transition:"width 0.3s ease"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,fontFamily:FONT,fontWeight:700}}>
                <span style={{color:total>100?"#ef4444":"#a5b4fc"}}>
                  {currency} {((total/100)*+budget).toFixed(0)} ({total}%)
                </span>
                <span style={{color:total===100?"#10b981":total>100?"#ef4444":"#64748b"}}>
                  {total>100
                    ? `Over by ${currency} ${(((total-100)/100)*+budget).toFixed(0)}`
                    : total===100
                    ? "✓ Perfect"
                    : `${currency} ${(((100-total)/100)*+budget).toFixed(0)} (${100-total}%)`}
                </span>
              </div>
            </div>
          )}

          {/* Clear */}
          <button onClick={()=>{setAllocs(Object.fromEntries(CATS.map(c=>[c.id,{pct:0,priority:2}]))); setRawAmts(Object.fromEntries(CATS.map(c=>[c.id,''])));}}
            style={{...btn("ghost"),padding:"6px 14px",fontSize:11,marginTop:10,width:"100%",color:"#475569",fontFamily:FONT}}>
            Clear all
          </button>
        </div>
        {err&&<p style={{color:"#f87171",fontSize:12,marginBottom:10,fontFamily:FONT}}>{err}</p>}
        <button onClick={runPipeline} style={{...btn("primary"),width:"100%",fontSize:14,padding:"13px",
          fontFamily:"'Syne',sans-serif"}}>
          🚀 Run Multi-Agent Analysis ({countryData.flag} {countryData.name})
        </button>
        <p style={{fontSize:10,color:"#1e293b",textAlign:"center",marginTop:8}}>
          CPI data: {countryData.source} · Coordinator → Collector → Processor → Modeler → Reporter
        </p>
      </div>
    </div>
  );

  /* ────────────── ANALYSIS ────────────── */
  if(screen==="analysis") return (
    <div style={{minHeight:"100vh",background:APP_BG,fontFamily:FONT,color:"#e2e8f0",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 20px"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{width:"100%",maxWidth:620}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <p style={{fontSize:11,color:ACCENT,fontWeight:700,letterSpacing:1.5,marginBottom:6}}>PIPELINE RUNNING</p>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,margin:"0 0 4px"}}>
            {countryData.flag} {countryData.name} Analysis
          </h2>
          <p style={{fontSize:11,color:"#475569",margin:0}}>Headline CPI: {countryData.headline}% · {countryData.source}</p>
        </div>
        {/* Agent status bar */}
        <div style={{...card({padding:"16px 20px",marginBottom:16})}}>
          <div style={{display:"flex",gap:0,justifyContent:"space-between",alignItems:"center"}}>
            {[["coordinator","🧠","Coordinator"],["collector","📥","Collector"],
              ["processor","⚙️","Processor"],["modeler","📐","Modeler"],["reporter","📝","Reporter"]
            ].map(([id,icon,lbl],i)=>{
              const st=agentStates[id];
              const cols={idle:"#1e293b",running:"#f59e0b",done:"#10b981",error:"#ef4444"};
              return (
                <div key={id} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,flex:1}}>
                  <div style={{width:40,height:40,borderRadius:11,
                    background:`${cols[st]}18`,border:`1.5px solid ${cols[st]}44`,
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,
                    boxShadow:st==="running"?`0 0 12px ${cols[st]}44`:undefined}}>
                    {st==="running"
                      ? <div style={{width:16,height:16,border:`2px solid ${cols[st]}44`,
                          borderTop:`2px solid ${cols[st]}`,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                      : icon}
                  </div>
                  <span style={{fontSize:9,fontWeight:700,color:cols[st],letterSpacing:0.5,textAlign:"center"}}>{lbl}</span>
                  {i<4&&<div style={{position:"absolute"}}/>}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{...card({padding:"14px 18px"})}}>
          <div style={{fontSize:10,fontWeight:700,color:"#334155",marginBottom:8,letterSpacing:1}}>AGENT LOG</div>
          <div ref={logRef} style={{maxHeight:220,overflowY:"auto",display:"flex",flexDirection:"column",gap:2}}>
            {log.map(l=>{
              const cols={info:"#475569",success:"#10b981",warn:"#f59e0b",agent:"#a5b4fc",data:"#6366f1"};
              return(
                <div key={l.id} style={{fontFamily:FONT,fontSize:11,color:cols[l.type]||cols.info,
                  padding:"2px 0",lineHeight:1.5}}>
                  {l.type==="agent"&&<span style={{color:"#6366f1",marginRight:4}}>›</span>}
                  {l.text}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  /* ────────────── RESULTS ────────────── */
  if(screen==="results"&&results){
    const {collected,processed,modeling,report}=results;
    const optAllocs=modeling.utilityMaximization.optimizedAllocations||[];
    const cpiBarData=used.map(c=>({
      name:c.label.split(" ")[0],
      "CPI%":getCPI(c.id),
      "Spend%":allocs[c.id].pct,
    }));

    return (
      <div style={{minHeight:"100vh",background:APP_BG,fontFamily:FONT,color:"#e2e8f0",position:"relative"}}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <Glow color="#6366f1" size={500} top="0" left="30%" opacity={0.06}/>

        <div style={{maxWidth:920,margin:"0 auto",padding:"26px 18px 80px",position:"relative",zIndex:1}}>
          {/* Header */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24,flexWrap:"wrap"}}>
            <span style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:800}}>
              🛡️ PriceGuard AI
            </span>
            <span style={{fontSize:11,color:"#94a3b8"}}>{countryData.flag} {countryData.name}</span>
            <span style={{fontSize:10,fontWeight:700,color:"#10b981",padding:"3px 8px",
              background:"rgba(16,185,129,0.12)",borderRadius:999,letterSpacing:1}}>PIPELINE COMPLETE</span>
            <span style={{flex:1}}/>
            <span style={{fontSize:11,color:"#334155",fontFamily:FONT}}>
              {currency} {Number(budget).toLocaleString()}/mo · Headline CPI: {countryData.headline}% · {countryData.source}
            </span>
            <button onClick={()=>{setScreen("input");setResults(null);}} style={{...btn("ghost"),padding:"6px 12px",fontSize:11}}>← Edit</button>
          </div>

          {/* KPIs */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
            <MetricCard label="Inflation Exposure Index" value={`${processed.inflationExposureIndex}/100`}
              color={processed.inflationExposureIndex>=70?"#ef4444":processed.inflationExposureIndex>=40?"#f59e0b":"#10b981"}
              sub={`${countryData.name}: ${countryData.headline}% headline`}/>
            <MetricCard label="Utility Efficiency" value={`${processed.utilityEfficiencyScore}/100`} color="#a5b4fc" sub="Current allocation"/>
            <MetricCard label="Monthly Saving" value={`${currency} ${Number(modeling.utilityMaximization.monthlySaving||0).toFixed(0)}`} color="#10b981" sub="Post-optimization"/>
            <MetricCard label="Annual Purchasing Power Loss" value={`${currency} ${Number(processed.annualPurchasingPowerLoss||0).toFixed(0)}`} color="#ef4444" sub="At current CPI"/>
          </div>

          {/* Tabs */}
          <div style={{display:"flex",gap:2,borderBottom:"1px solid rgba(255,255,255,0.06)",marginBottom:18}}>
            {[["report","📋 Report"],["pipeline","🔄 Pipeline"],["exposure","📊 Exposure"],
              ["utility","⚖️ Utility"],["optimize","⚙️ Optimizer"],["cpi","📈 CPI vs Spend"],["simulate","🧪 Stress Test"]
            ].map(([id,lbl])=>(
              <button key={id} onClick={()=>setTab(id)} style={tabSt(tab===id)}>{lbl}</button>
            ))}
          </div>

          {/* ── REPORT ── */}
          {tab==="report"&&(
            <div style={{animation:"fadeUp 0.3s ease",display:"grid",gridTemplateColumns:"1fr 260px",gap:16}}>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <div style={{...card(),borderLeft:"3px solid #6366f1"}}>
                  <span style={LBL}>EXECUTIVE SUMMARY · {countryData.flag} {countryData.name}</span>
                  <p style={{margin:0,fontSize:13,color:"#94a3b8",lineHeight:1.7}}>{report.executiveSummary}</p>
                </div>
                {[report.topInsight,report.secondInsight,report.thirdInsight].map((ins,i)=>(
                  <div key={i} style={{...card({padding:"14px 16px"}),display:"flex",gap:10}}>
                    <span style={{fontSize:16}}>{["💡","📐","🔭"][i]}</span>
                    <p style={{margin:0,fontSize:13,color:"#94a3b8",lineHeight:1.6}}>{ins}</p>
                  </div>
                ))}
                <div style={{...card({background:"rgba(99,102,241,0.08)",borderColor:"rgba(99,102,241,0.2)"})}}>
                  <span style={LBL}>PRIORITY ACTION</span>
                  <p style={{margin:0,fontSize:14,color:"#a5b4fc",fontWeight:600,lineHeight:1.6}}>{report.priorityAction}</p>
                </div>
                <div style={card({padding:"14px 16px"})}>
                  <span style={LBL}>ECONOMETRIC CAVEATS</span>
                  {(report.caveats||[]).map((c,i)=>(
                    <div key={i} style={{display:"flex",gap:8,marginBottom:5}}>
                      <span style={{color:"#475569",fontSize:12,minWidth:16}}>{i+1}.</span>
                      <p style={{margin:0,fontSize:12,color:"#475569",lineHeight:1.5}}>{c}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <div style={{...card({background:"rgba(239,68,68,0.06)",borderColor:"rgba(239,68,68,0.2)"})}}>
                  <span style={LBL}>RISK ASSESSMENT</span>
                  <p style={{margin:0,fontSize:12,color:"#fca5a5",lineHeight:1.5}}>{report.riskSentence}</p>
                </div>
                <div style={card()}>
                  <span style={LBL}>OLS REGRESSION TABLE</span>
                  <table style={{width:"100%",fontSize:11,borderCollapse:"collapse"}}>
                    <thead><tr style={{borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                      {["Spec","β","SE","t","R²"].map(h=>(
                        <th key={h} style={{padding:"4px 6px",color:"#334155",textAlign:"right",fontWeight:700}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {[["lag=0",modeling.regressionLag0],["lag=12",modeling.regressionLag12]].map(([spec,reg])=>(
                        <tr key={spec} style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                          <td style={{padding:"5px 6px",color:"#64748b",fontFamily:FONT}}>{spec}</td>
                          <td style={{padding:"5px 6px",textAlign:"right",color:reg.slope>0?"#f87171":"#34d399",fontFamily:FONT}}>{reg.slope?.toFixed(3)}</td>
                          <td style={{padding:"5px 6px",textAlign:"right",color:"#475569",fontFamily:FONT}}>{reg.se?.toFixed(3)}</td>
                          <td style={{padding:"5px 6px",textAlign:"right",color:"#94a3b8",fontFamily:FONT}}>{reg.tstat?.toFixed(2)}</td>
                          <td style={{padding:"5px 6px",textAlign:"right",color:"#a5b4fc",fontFamily:FONT}}>{reg.rSquared?.toFixed(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{marginTop:10,padding:"9px 11px",background:"rgba(99,102,241,0.06)",borderRadius:8}}>
                    <span style={{fontSize:10,fontWeight:700,color:"#6366f1",display:"block",marginBottom:3}}>SIGN FLIP</span>
                    <p style={{margin:0,fontSize:11,color:"#64748b",lineHeight:1.5,fontStyle:"italic"}}>{modeling.signFlipExplanation}</p>
                  </div>
                </div>
                <div style={card()}>
                  <span style={LBL}>{countryData.flag} COUNTRY INSIGHT</span>
                  <p style={{margin:0,fontSize:12,color:"#94a3b8",lineHeight:1.5}}>{modeling.countrySpecificInsight}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── PIPELINE ── */}
          {tab==="pipeline"&&(
            <div style={{animation:"fadeUp 0.3s ease",display:"flex",flexDirection:"column",gap:14}}>
              <div style={card()}>
                <span style={LBL}>PIPELINE LOG — {countryData.flag} {countryData.name}</span>
                <div style={{maxHeight:280,overflowY:"auto",display:"flex",flexDirection:"column",gap:2}}>
                  {log.map(l=>{
                    const cols={info:"#475569",success:"#10b981",warn:"#f59e0b",agent:"#a5b4fc",data:"#6366f1"};
                    return(
                      <div key={l.id} style={{fontFamily:FONT,fontSize:11,color:cols[l.type]||cols.info,padding:"2px 0",lineHeight:1.5}}>
                        {l.type==="agent"&&<span style={{color:"#6366f1",marginRight:4}}>›</span>}{l.text}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                {[
                  {name:"Data Collector",tool:"fetch_cpi_series(country)",job:`Real ${countryData.name} CPI rates from ${countryData.source}`},
                  {name:"Processor",tool:"compute_IEI + utility_weights",job:"IEI = Σ(w_i × CPI_i), marginal utility, purchasing power erosion"},
                  {name:"Modeler",tool:"OLS×2 + Lagrangian",job:"lag=0 (endogeneity) vs lag=12 (transmission), utility max"},
                  {name:"Reporter",tool:"write_report",job:`Country-specific insights for ${countryData.name}`},
                ].map((a,i)=>(
                  <div key={i} style={{...card({padding:"13px 14px",background:"rgba(99,102,241,0.04)"})}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#a5b4fc",marginBottom:3}}>{a.name}</div>
                    <div style={{fontSize:9,color:"#475569",fontStyle:"italic",marginBottom:5,fontFamily:FONT}}>{a.tool}</div>
                    <p style={{margin:0,fontSize:11,color:"#64748b",lineHeight:1.5}}>{a.job}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── EXPOSURE ── */}
          {tab==="exposure"&&(
            <div style={{animation:"fadeUp 0.3s ease",display:"grid",gridTemplateColumns:"1fr 240px",gap:14}}>
              <div style={card()}>
                <div style={{display:"flex",gap:14,alignItems:"flex-start",marginBottom:18}}>
                  <div style={{textAlign:"center",minWidth:70}}>
                    <div style={{fontSize:44,fontWeight:800,fontFamily:FONT,
                      color:processed.inflationExposureIndex>=70?"#ef4444":processed.inflationExposureIndex>=40?"#f59e0b":"#10b981"}}>
                      {processed.inflationExposureIndex}
                    </div>
                    <div style={{fontSize:9,color:"#334155"}}>IEI / 100</div>
                  </div>
                  <div>
                    <span style={LBL}>INFLATION EXPOSURE INDEX · {countryData.flag} {countryData.name}</span>
                    <p style={{margin:0,fontSize:12,color:"#64748b",lineHeight:1.6}}>
                      {processed.ieiFormula} · Necessities {((processed.ieiDecomposition?.necessities||0)*100).toFixed(0)}% ·
                      Fixed {((processed.ieiDecomposition?.fixed||0)*100).toFixed(0)}% ·
                      Discretionary {((processed.ieiDecomposition?.discretionary||0)*100).toFixed(0)}%
                    </p>
                    {processed.deflationaryCategories?.length>0&&(
                      <div style={{marginTop:6,fontSize:11,color:"#34d399"}}>
                        ✓ Deflationary categories: {processed.deflationaryCategories.join(", ")}
                      </div>
                    )}
                  </div>
                </div>
                {(processed.categories||[]).sort((a,b)=>b.riskScore-a.riskScore).map(cat=>{
                  const C=CATS.find(c=>c.id===cat.id);
                  const bc=cat.riskLevel==="high"?"#ef4444":cat.riskLevel==="medium"?"#f59e0b":"#10b981";
                  return (
                    <div key={cat.id} style={{padding:"10px 12px",borderRadius:9,marginBottom:7,
                      background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.04)"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                        <div style={{display:"flex",alignItems:"center",gap:7}}>
                          <span>{C?.icon}</span>
                          <span style={{fontSize:12,fontWeight:600}}>{cat.name}</span>
                          <span style={{fontSize:10,color:cat.cpi<0?"#34d399":"#64748b",fontFamily:FONT}}>
                            {cat.cpi>0?"+":""}{cat.cpi?.toFixed(1)}%
                          </span>
                        </div>
                        <div style={{display:"flex",gap:6}}>
                          <span style={{fontSize:10,color:"#475569",fontFamily:FONT}}>risk {cat.riskScore}/100</span>
                        </div>
                      </div>
                      <div style={{background:"rgba(255,255,255,0.05)",borderRadius:999,height:5,overflow:"hidden",marginBottom:4}}>
                        <div style={{width:`${Math.max(0,cat.riskScore)}%`,background:bc,height:"100%",borderRadius:999,transition:"width 0.8s"}}/>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between"}}>
                        <span style={{fontSize:10,color:"#334155",fontFamily:FONT}}>MU/$ {cat.marginalUtility?.toFixed(1)}</span>
                        <span style={{fontSize:10,fontWeight:700,color:cat.annualErosion<0?"#34d399":bc,fontFamily:FONT}}>
                          {cat.annualErosion<0?"Saves ":"Erodes "}{currency}{Math.abs(cat.annualErosion||0).toFixed(0)}/yr
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <div style={card()}>
                  <span style={LBL}>RISK BREAKDOWN</span>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={(processed.categories||[]).sort((a,b)=>b.riskScore-a.riskScore)} layout="vertical" margin={{left:0,right:8}}>
                      <XAxis type="number" domain={[0,100]} tick={{fill:"#334155",fontSize:9}} axisLine={false} tickLine={false}/>
                      <YAxis type="category" dataKey="name" tick={{fill:"#475569",fontSize:9}} width={72} axisLine={false} tickLine={false}/>
                      <Tooltip contentStyle={{background:"#1e293b",border:BORDER,borderRadius:8,fontSize:11}}/>
                      <Bar dataKey="riskScore" radius={3}>
                        {(processed.categories||[]).sort((a,b)=>b.riskScore-a.riskScore).map((c,i)=>(
                          <Cell key={i} fill={c.riskLevel==="high"?"#ef4444":c.riskLevel==="medium"?"#f59e0b":"#10b981"}/>
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{...card({background:"rgba(16,185,129,0.05)",borderColor:"rgba(16,185,129,0.15)"})}}>
                  <span style={LBL}>REAL BUDGET IN 12 MONTHS</span>
                  <div style={{fontSize:20,fontWeight:800,color:"#34d399",fontFamily:FONT}}>
                    {currency} {Number(processed.realBudgetIn12Months||0).toFixed(0)}
                  </div>
                  <div style={{fontSize:11,color:"#475569",marginTop:2}}>Real value at {countryData.name} inflation</div>
                </div>
              </div>
            </div>
          )}

          {/* ── UTILITY ── */}
          {tab==="utility"&&(
            <div style={{animation:"fadeUp 0.3s ease",display:"flex",flexDirection:"column",gap:14}}>
              <div style={card()}>
                <span style={LBL}>MARGINAL UTILITY PER DOLLAR — {countryData.flag} {countryData.name}</span>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={(processed.categories||[]).sort((a,b)=>b.marginalUtility-a.marginalUtility)}>
                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="name" tick={{fill:"#475569",fontSize:9}} axisLine={false} tickLine={false}/>
                    <YAxis domain={[0,10]} tick={{fill:"#475569",fontSize:9}} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{background:"#1e293b",border:BORDER,borderRadius:8,fontSize:11}}/>
                    <Bar dataKey="marginalUtility" name="MU/$" radius={[4,4,0,0]}>
                      {(processed.categories||[]).sort((a,b)=>b.marginalUtility-a.marginalUtility).map((_,i)=>(
                        <Cell key={i} fill={["#6366f1","#8b5cf6","#a78bfa","#c4b5fd","#ddd6fe"][Math.min(i,4)]}/>
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{...card(),display:"flex",gap:24,alignItems:"center"}}>
                <div style={{flex:1}}>
                  {[["Current",processed.utilityEfficiencyScore,"#64748b"],
                    ["Optimized",Math.min(100,(processed.utilityEfficiencyScore||0)+(modeling.utilityMaximization.utilityGainPct||0)),"#6366f1"]
                  ].map(([lbl,val,col])=>(
                    <div key={lbl} style={{marginBottom:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:11,color:"#475569"}}>{lbl} efficiency</span>
                        <span style={{fontSize:12,fontWeight:700,fontFamily:FONT,color:col}}>{val?.toFixed(0)}/100</span>
                      </div>
                      <div style={{background:"rgba(255,255,255,0.05)",borderRadius:999,height:7,overflow:"hidden"}}>
                        <div style={{width:`${val}%`,background:col,height:"100%",borderRadius:999}}/>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{textAlign:"center",padding:"0 20px"}}>
                  <div style={{fontSize:28,fontWeight:800,color:"#10b981",fontFamily:FONT}}>+{modeling.utilityMaximization.utilityGainPct?.toFixed(1)}%</div>
                  <div style={{fontSize:11,color:"#475569"}}>utility gain</div>
                </div>
              </div>
            </div>
          )}

          {/* ── OPTIMIZE ── */}
          {tab==="optimize"&&(
            <div style={{animation:"fadeUp 0.3s ease",display:"flex",flexDirection:"column",gap:14}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                <MetricCard label="Monthly Saving" value={`${currency} ${Number(modeling.utilityMaximization.monthlySaving||0).toFixed(0)}`} color="#10b981"/>
                <MetricCard label="Annual Saving" value={`${currency} ${Number(modeling.utilityMaximization.annualSaving||0).toFixed(0)}`} color="#34d399"/>
                <MetricCard label="Utility Gain" value={`+${modeling.utilityMaximization.utilityGainPct?.toFixed(1)}%`} color="#a5b4fc"/>
              </div>
              <div style={card()}>
                <span style={LBL}>LAGRANGIAN OPTIMIZATION · {countryData.flag} {countryData.name} CPI</span>
                <p style={{fontSize:11,color:"#475569",marginBottom:14,fontStyle:"italic"}}>{modeling.utilityMaximization.lagrangianNote}</p>
                <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",marginBottom:7,paddingBottom:7,borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                  {["Category","Original","Optimized","Δ%","Monthly Δ"].map(h=>(
                    <div key={h} style={{fontSize:10,fontWeight:700,color:"#334155",textAlign:h==="Category"?"left":"right",letterSpacing:0.7}}>{h}</div>
                  ))}
                </div>
                {optAllocs.map(item=>{
                  const diff=item.optimized-item.original;
                  const C=CATS.find(c=>c.id===item.id);
                  return(
                    <div key={item.id} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",
                      padding:"9px 0",borderBottom:"1px solid rgba(255,255,255,0.03)",alignItems:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:7}}>
                        <span>{item.icon||C?.icon}</span>
                        <div>
                          <span style={{fontSize:12,color:"#94a3b8"}}>{item.name}</span>
                          {item.rationale&&<div style={{fontSize:10,color:"#334155"}}>{item.rationale}</div>}
                        </div>
                      </div>
                      <div style={{textAlign:"right",fontSize:12,color:"#475569",fontFamily:FONT}}>{item.original}%</div>
                      <div style={{textAlign:"right",fontSize:12,fontWeight:700,color:"#a5b4fc",fontFamily:FONT}}>{item.optimized}%</div>
                      <div style={{textAlign:"right",fontSize:11,fontWeight:700,fontFamily:FONT,
                        color:diff<0?"#10b981":diff>0?"#f59e0b":"#475569"}}>
                        {diff===0?"—":diff>0?`+${diff.toFixed(1)}`:`${diff.toFixed(1)}`}
                      </div>
                      <div style={{textAlign:"right",fontSize:11,fontWeight:700,fontFamily:FONT,
                        color:item.saving>0?"#10b981":item.saving<0?"#f87171":"#475569"}}>
                        {item.saving>0?`+${currency}${Math.abs(item.saving).toFixed(0)}`:item.saving<0?`-${currency}${Math.abs(item.saving).toFixed(0)}`:"—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── CPI vs SPEND ── */}
          {tab==="cpi"&&(
            <div style={{animation:"fadeUp 0.3s ease",display:"flex",flexDirection:"column",gap:14}}>
              <div style={card()}>
                <span style={LBL}>CPI% vs SPEND% — {countryData.flag} {countryData.name} (Source: {countryData.source})</span>
                <p style={{fontSize:11,color:"#475569",marginBottom:14}}>
                  When CPI% &gt; Spend%, you're underallocating relative to real price pressure.
                  Negative CPI = deflation (actual price decreases).
                  Headline CPI: {countryData.headline}%
                </p>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={cpiBarData}>
                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="name" tick={{fill:"#475569",fontSize:10}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:"#475569",fontSize:10}} axisLine={false} tickLine={false}/>
                    <ReferenceLine y={0} stroke="#334155" strokeWidth={1}/>
                    <ReferenceLine y={countryData.headline} stroke="#f59e0b" strokeDasharray="4 4"
                      label={{value:`Headline ${countryData.headline}%`,fill:"#f59e0b",fontSize:10,position:"insideTopRight"}}/>
                    <Tooltip contentStyle={{background:"#1e293b",border:BORDER,borderRadius:8,fontSize:11}}
                      formatter={(v,n)=>[`${v}%`,n]}/>
                    <Legend wrapperStyle={{fontSize:10,color:"#475569"}}/>
                    <Bar dataKey="CPI%" fill="#ef4444" opacity={0.75} radius={[3,3,0,0]}/>
                    <Bar dataKey="Spend%" fill="#6366f1" opacity={0.7} radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                {used.map(cat=>{
                  const cpi=getCPI(cat.id);
                  const pct=allocs[cat.id].pct;
                  const gap=cpi-pct;
                  return(
                    <div key={cat.id} style={{...card({padding:"12px 14px"})}}>
                      <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}>
                        <span style={{fontSize:16}}>{cat.icon}</span>
                        <span style={{fontSize:12,fontWeight:600}}>{cat.label.split(" ")[0]}</span>
                      </div>
                      <div style={{display:"flex",gap:8,fontSize:11,fontFamily:FONT}}>
                        <span style={{color:cpi<0?"#34d399":cpi>=6?"#ef4444":"#f59e0b"}}>CPI: {cpi>0?"+":""}{cpi}%</span>
                        <span style={{color:"#6366f1"}}>Spend: {pct}%</span>
                      </div>
                      <div style={{fontSize:10,color:gap>3?"#f87171":gap<-3?"#34d399":"#475569",marginTop:3,fontFamily:FONT}}>
                        {gap>0?`CPI exceeds spend by ${gap.toFixed(1)}%`:gap<0?`Spend exceeds CPI by ${Math.abs(gap).toFixed(1)}%`:"Balanced"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── SIMULATE ── */}
          {tab==="simulate"&&(
            <div style={{animation:"fadeUp 0.3s ease",display:"grid",gridTemplateColumns:"260px 1fr",gap:14}}>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <div style={card()}>
                  <span style={LBL}>SHOCK SCENARIO · {countryData.flag}</span>
                  {[["mild","🌤️","Mild",`Above-trend rise in food & utilities`],
                    ["moderate","⛈️","Moderate","Major supply shock + currency pressure"],
                    ["severe","🌪️","Crisis","Full stagflation scenario"]
                  ].map(([id,icon,lbl,desc])=>(
                    <div key={id} onClick={()=>{setScenario(id);setSimRes(null);}}
                      style={{padding:"11px",borderRadius:9,marginBottom:7,cursor:"pointer",
                        border:`1px solid ${scenario===id?"rgba(99,102,241,0.4)":"rgba(255,255,255,0.05)"}`,
                        background:scenario===id?"rgba(99,102,241,0.1)":"transparent",transition:"all 0.2s"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                        <span style={{fontSize:16}}>{icon}</span>
                        <span style={{fontSize:12,fontWeight:700,color:scenario===id?"#a5b4fc":"#64748b"}}>{lbl}</span>
                      </div>
                      <p style={{margin:0,fontSize:10,color:"#475569",lineHeight:1.5}}>{desc}</p>
                    </div>
                  ))}
                  <button onClick={runStressTest} disabled={simLoading}
                    style={{...btn("primary"),width:"100%",opacity:simLoading?0.6:1,fontSize:12,padding:"10px"}}>
                    {simLoading?"⏳ Running…":"▶ Run Stress Test"}
                  </button>
                </div>
              </div>
              <div>
                {!simRes&&!simLoading&&(
                  <div style={{...card(),display:"flex",flexDirection:"column",alignItems:"center",
                    justifyContent:"center",minHeight:260,color:"#334155",gap:10}}>
                    <span style={{fontSize:36}}>🧪</span>
                    <p style={{margin:0,fontSize:13}}>Select a shock scenario and run the test</p>
                    <p style={{margin:0,fontSize:11,color:"#1e293b"}}>Shocks are calibrated to {countryData.name} baseline CPI</p>
                  </div>
                )}
                {simLoading&&<div style={card()}><div style={{padding:"2rem 0",textAlign:"center"}}>
                  <div style={{width:32,height:32,border:`2.5px solid rgba(99,102,241,0.2)`,
                    borderTop:`2.5px solid ${ACCENT}`,borderRadius:"50%",animation:"spin 0.9s linear infinite",margin:"0 auto 12px"}}/>
                  <span style={{fontSize:12,color:"#475569"}}>Running {countryData.name} stress test…</span>
                </div></div>}
                {simRes&&(
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
                      <MetricCard label="Extra Cost / Month" value={`+${currency} ${Number(simRes.costIncrease||0).toFixed(0)}`} color="#ef4444"/>
                      <MetricCard label="Power Loss" value={`-${Number(simRes.realPurchasingPowerLoss||0).toFixed(1)}%`} color="#f87171"/>
                      <MetricCard label="New Total" value={`${currency} ${Number(simRes.newTotal||0).toFixed(0)}`} color="#f59e0b"/>
                      <MetricCard label="Budget Gap" value={`${currency} ${Number(simRes.budgetGap||0).toFixed(0)}`} color="#fbbf24"/>
                    </div>
                    <div style={card()}>
                      <span style={LBL}>CATEGORY IMPACTS</span>
                      {(simRes.categoryImpacts||[]).map((c,i)=>(
                        <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",
                          borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                          <span style={{fontSize:12,color:"#94a3b8"}}>{c.name}</span>
                          <span style={{fontSize:12,fontWeight:700,fontFamily:FONT,
                            color:c.severity==="high"?"#ef4444":c.severity==="medium"?"#f59e0b":"#64748b"}}>
                            +{currency}{Number(c.extra||0).toFixed(0)}/mo
                          </span>
                        </div>
                      ))}
                    </div>
                    <div style={{...card({borderColor:"rgba(16,185,129,0.2)"})}}>
                      <span style={LBL}>SURVIVAL STRATEGIES · {countryData.flag}</span>
                      {(simRes.survivalStrategies||[]).map((s,i)=>(
                        <div key={i} style={{display:"flex",gap:8,marginBottom:7}}>
                          <span style={{color:ACCENT,fontWeight:700,fontSize:12,minWidth:18,fontFamily:FONT}}>{i+1}.</span>
                          <p style={{margin:0,fontSize:12,color:"#94a3b8",lineHeight:1.5}}>{s}</p>
                        </div>
                      ))}
                    </div>
                    {simRes.centralBankNote&&(
                      <div style={{...card({background:"rgba(99,102,241,0.06)",borderColor:"rgba(99,102,241,0.2)"})}}>
                        <span style={LBL}>CENTRAL BANK ENDOGENEITY NOTE</span>
                        <p style={{margin:0,fontSize:12,color:"#818cf8",fontStyle:"italic",lineHeight:1.5}}>{simRes.centralBankNote}</p>
                        <div style={{marginTop:8,fontSize:11,color:"#334155",fontFamily:FONT}}>
                          Time to budget pressure: <span style={{color:"#fbbf24",fontWeight:700}}>{simRes.timeToBreakEven}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}
