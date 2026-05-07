// Text-based tools: Content, Calendar, Scripts, Hashtags, Replies, Pricing
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import {
  Inp, Label, Chip, Card, CopyBtn, GenBtn, RegenBtn, Spinner, ErrorBanner,
  PlatformPill, useGenerate, useCopy,
} from './ui';
import { C, FONTS, RADIUS } from '../lib/theme';
import { Profile } from '../lib/store';
import { callClaude } from '../lib/api';

type ToolProps = { profile: Profile | null; onGenerate: () => Promise<boolean> };

// ════════════════════════════════════════════════════════════
// CONTENT TAB
// ════════════════════════════════════════════════════════════
export function ContentTool({ profile, onGenerate }: ToolProps) {
  const [type, setType] = useState('daily');
  const [platform, setPlatform] = useState('both');
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState<any>(null);
  const { loading, error, clearError, run } = useGenerate();
  const { copiedId, copy } = useCopy();

  const TYPES: [string, string][] = [
    ['daily', 'Daily Post'], ['hook', 'Hook'], ['promo', 'Promo'],
    ['transformation', 'Before/After'], ['week', 'Full Week'],
  ];
  const PLATS: [string, string][] = [['both', 'Both'], ['instagram', 'Instagram'], ['tiktok', 'TikTok']];

  const generate = useCallback(async () => {
    if (!(await onGenerate())) return;
    setResult(null);
    const typeMap: Record<string, string> = {
      daily: 'a daily engaging post',
      hook: 'an attention-grabbing scroll-stopping hook',
      promo: 'a promotional post about a special offer',
      transformation: 'a before & after transformation reveal post',
      week: '7 daily posts labeled Day 1 through Day 7',
    };
    const platMap: Record<string, string> = {
      instagram: 'Instagram only — caption + 10-15 hashtags',
      tiktok: 'TikTok only — hook + script + sound suggestion + 5-8 hashtags',
      both: 'Both. Format:\n📸 INSTAGRAM:\n[content]\n\n🎵 TIKTOK:\n[content]',
    };
    const prompt = `You are a bold social media expert for ${profile?.biz}, a ${profile?.niche} business in ${profile?.city}.
${profile?.booking ? `Booking/contact: ${profile.booking}` : ''}
Tone: Bold, edgy, street-smart, confident. Goal: drive foot traffic and bookings.
${topic ? `Today's focus: ${topic}` : ''}
Create ${typeMap[type]} for ${platMap[platform]}.
Rules: punchy opening, strong CTA referencing ${profile?.booking || 'their booking page'}, emojis used strategically.`;

    await run(async () => {
      const text = await callClaude(prompt, { maxTokens: 1400 });
      if (platform === 'both') {
        const ig = text.match(/📸\s*INSTAGRAM[:\s]*([\s\S]*?)(?=🎵\s*TIKTOK|$)/i)?.[1]?.trim() || text;
        const tt = text.match(/🎵\s*TIKTOK[:\s]*([\s\S]*?)$/i)?.[1]?.trim() || '';
        setResult({ type: 'dual', ig, tt });
      } else if (type === 'week') {
        const days = [...text.matchAll(/Day\s*(\d+)[:\s]*([\s\S]*?)(?=Day\s*\d+|$)/gi)]
          .map(m => ({ day: m[1], content: m[2].trim() }));
        if (days.length === 0) throw new Error("Couldn't parse the weekly calendar. Try regenerating.");
        setResult({ type: 'week', days });
      } else {
        setResult({ type: 'single', content: text.trim(), platform });
      }
    });
  }, [profile, type, platform, topic, onGenerate, run]);

  return (
    <View>
      <Label>CONTENT TYPE</Label>
      <View style={st.chipRow}>
        {TYPES.map(([id, lbl]) => <Chip key={id} label={lbl} active={type === id} onPress={() => setType(id)} />)}
      </View>
      <Label>PLATFORM</Label>
      <View style={st.chipRow}>
        {PLATS.map(([id, lbl]) => <Chip key={id} label={lbl} active={platform === id} onPress={() => setPlatform(id)} />)}
      </View>
      <Label>TODAY'S FOCUS (OPTIONAL)</Label>
      <Inp value={topic} onChangeText={setTopic} placeholder="e.g. Weekend fade special..." testID="topic-input" />
      <View style={{ height: 14 }} />
      <GenBtn onPress={generate} loading={loading} testID="content-gen-btn" />
      <ErrorBanner message={error} onRetry={generate} onDismiss={clearError} />
      {loading && <Spinner />}
      {result && !loading && !error && (
        <View style={{ marginTop: 18 }} testID="content-result">
          {result.type === 'dual' && (
            <>
              <ResultCard accent={C.ig} label="📸 INSTAGRAM" content={result.ig} id="ig" copiedId={copiedId} copy={copy} />
              <ResultCard accent={C.tt} label="🎵 TIKTOK" content={result.tt} id="tt" copiedId={copiedId} copy={copy} />
            </>
          )}
          {result.type === 'week' && result.days.map((d: any, i: number) => (
            <ResultCard key={i} accent={C.gold} label={`DAY ${d.day}`} content={d.content} id={`d${i}`} copiedId={copiedId} copy={copy} />
          ))}
          {result.type === 'single' && (
            <ResultCard
              accent={result.platform === 'instagram' ? C.ig : C.tt}
              label={result.platform === 'instagram' ? '📸 INSTAGRAM' : '🎵 TIKTOK'}
              content={result.content} id="s" copiedId={copiedId} copy={copy}
            />
          )}
          <RegenBtn onPress={generate} />
        </View>
      )}
    </View>
  );
}

// ════════════════════════════════════════════════════════════
// CALENDAR TAB
// ════════════════════════════════════════════════════════════
export function CalendarTool({ profile, onGenerate }: ToolProps) {
  const [goal, setGoal] = useState('Drive bookings and foot traffic');
  const [calendar, setCalendar] = useState<any[] | null>(null);
  const { loading, error, clearError, run } = useGenerate();
  const { copiedId, copy } = useCopy();

  const generate = useCallback(async () => {
    if (!(await onGenerate())) return;
    setCalendar(null);
    const prompt = `Social media strategist for ${profile?.biz} (${profile?.niche}) in ${profile?.city}. Goal: ${goal}.
${profile?.booking ? `Booking/contact: ${profile.booking}` : ''}
Create a 7-day content calendar (Monday–Sunday). For each day:
DAY: [day]
PLATFORM: [Instagram or TikTok]
TYPE: [content type]
TIME: [best post time]
CAPTION: [full caption with emojis and hashtags]
---`;

    await run(async () => {
      const text = await callClaude(prompt, { maxTokens: 2200 });
      const blocks = text.split('---').filter(b => b.trim());
      const days = blocks.map(b => {
        const get = (k: string) => b.match(new RegExp(`${k}:\\s*([\\s\\S]*?)(?=\\n[A-Z]+:|$)`))?.[1]?.trim() || '';
        return { day: get('DAY'), platform: get('PLATFORM'), type: get('TYPE'), time: get('TIME'), caption: get('CAPTION') };
      }).filter(d => d.day);
      if (days.length === 0) throw new Error("Couldn't parse the calendar. Please regenerate.");
      setCalendar(days);
    });
  }, [profile, goal, onGenerate, run]);

  return (
    <View>
      <Label>CONTENT GOAL</Label>
      <Inp value={goal} onChangeText={setGoal} placeholder="Drive bookings, grow followers..." />
      <View style={{ height: 14 }} />
      <GenBtn onPress={generate} loading={loading} label="⚡ BUILD MY WEEK" testID="cal-gen-btn" />
      <ErrorBanner message={error} onRetry={generate} onDismiss={clearError} />
      {loading && <Spinner label="BUILDING YOUR CALENDAR..." />}
      {calendar && !loading && !error && (
        <View style={{ marginTop: 18 }} testID="cal-result">
          {calendar.map((d, i) => {
            const isIG = d.platform?.toLowerCase().includes('instagram');
            const acc = isIG ? C.ig : C.tt;
            return (
              <Card key={i} accent={acc}>
                <View style={st.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={st.cardTitle}>{d.day?.toUpperCase()}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                      <PlatformPill platform={d.platform} />
                      <View style={[st.tag, { backgroundColor: '#1a1a1a' }]}>
                        <Text style={[st.tagText, { color: C.textMute }]}>{d.type}</Text>
                      </View>
                      <View style={[st.tag, { backgroundColor: '#1a1a1a' }]}>
                        <Text style={[st.tagText, { color: C.textMute }]}>⏰ {d.time}</Text>
                      </View>
                    </View>
                  </View>
                  <CopyBtn text={d.caption} id={`c${i}`} copiedId={copiedId} onCopy={copy} small />
                </View>
                <Text style={st.cardBody}>{d.caption}</Text>
              </Card>
            );
          })}
          <RegenBtn onPress={generate} />
        </View>
      )}
    </View>
  );
}

// ════════════════════════════════════════════════════════════
// TIKTOK SCRIPTS TAB
// ════════════════════════════════════════════════════════════
export function ScriptsTool({ profile, onGenerate }: ToolProps) {
  const [vtype, setVtype] = useState('transformation');
  const [topic, setTopic] = useState('');
  const [script, setScript] = useState<any>(null);
  const { loading, error, clearError, run } = useGenerate();
  const { copiedId, copy } = useCopy();

  const VTYPES: [string, string][] = [
    ['transformation', 'Transformation'], ['dayinlife', 'Day in Life'],
    ['tutorial', 'How-To'], ['viral', 'Viral Hook'], ['promo', 'Promo'],
  ];

  const generate = useCallback(async () => {
    if (!(await onGenerate())) return;
    setScript(null);
    const prompt = `Viral TikTok strategist for ${profile?.biz} (${profile?.niche}) in ${profile?.city}.
${profile?.booking ? `Booking: ${profile.booking}` : ''}
${topic ? `Topic: ${topic}` : ''}
Create a "${vtype}" TikTok script. Tone: Bold, edgy, confident.
Format EXACTLY:
HOOK: [first 3 seconds]
SCRIPT: [full 30-60 second script]
ON-SCREEN TEXT: [text overlays]
CAPTION: [TikTok caption]
HASHTAGS: [8-10 hashtags]
SOUND VIBE: [music description]
FILMING TIPS: [2-3 tips]`;

    await run(async () => {
      const text = await callClaude(prompt, { maxTokens: 1500 });
      const get = (k: string) => text.match(new RegExp(`${k}:\\s*([\\s\\S]*?)(?=\\n[A-Z -]+:|$)`))?.[1]?.trim() || '';
      const parsed = {
        hook: get('HOOK'), body: get('SCRIPT'), onscreen: get('ON-SCREEN TEXT'),
        caption: get('CAPTION'), hashtags: get('HASHTAGS'), sound: get('SOUND VIBE'), tips: get('FILMING TIPS'),
      };
      if (!parsed.hook && !parsed.body) throw new Error("Couldn't parse the script. Please regenerate.");
      setScript(parsed);
    });
  }, [profile, vtype, topic, onGenerate, run]);

  const Sec = ({ label, content, id }: any) => content ? (
    <View style={{ marginBottom: 12 }}>
      <View style={[st.rowBetween, { marginBottom: 6 }]}>
        <Label>{label}</Label>
        <CopyBtn text={content} id={id} copiedId={copiedId} onCopy={copy} small />
      </View>
      <View style={st.scriptBox}>
        <Text style={st.cardBody}>{content}</Text>
      </View>
    </View>
  ) : null;

  return (
    <View>
      <Label>VIDEO TYPE</Label>
      <View style={st.chipRow}>
        {VTYPES.map(([id, lbl]) => (
          <Chip key={id} label={lbl} active={vtype === id} onPress={() => setVtype(id)} color={C.tt} />
        ))}
      </View>
      <Label>VIDEO TOPIC (OPTIONAL)</Label>
      <Inp value={topic} onChangeText={setTopic} placeholder="e.g. Bald fade on curly hair..." />
      <View style={{ height: 14 }} />
      <GenBtn onPress={generate} loading={loading} label="⚡ WRITE MY SCRIPT" testID="script-gen-btn" />
      <ErrorBanner message={error} onRetry={generate} onDismiss={clearError} />
      {loading && <Spinner label="WRITING YOUR SCRIPT..." />}
      {script && !loading && !error && (
        <View style={{ marginTop: 18 }} testID="script-result">
          <View style={st.hookBox}>
            <Text style={st.hookLabel}>🔥 HOOK — FIRST 3 SECONDS</Text>
            <Text style={st.hookText}>{script.hook}</Text>
          </View>
          <Sec label="📝 FULL SCRIPT" content={script.body} id="sc" />
          <Sec label="📺 ON-SCREEN TEXT" content={script.onscreen} id="os" />
          <Sec label="📱 CAPTION" content={script.caption} id="cap" />
          <Sec label="#️⃣ HASHTAGS" content={script.hashtags} id="ht" />
          <Sec label="🎵 SOUND VIBE" content={script.sound} id="sv" />
          <Sec label="🎥 FILMING TIPS" content={script.tips} id="ft" />
          <RegenBtn onPress={generate} />
        </View>
      )}
    </View>
  );
}

// ════════════════════════════════════════════════════════════
// HASHTAGS TAB
// ════════════════════════════════════════════════════════════
export function HashtagsTool({ profile, onGenerate }: ToolProps) {
  const [platform, setPlatform] = useState('both');
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const { loading, error, clearError, run } = useGenerate();
  const { copiedId, copy } = useCopy();

  const generate = useCallback(async () => {
    if (!(await onGenerate())) return;
    setResult(null);
    const prompt = `Hashtag strategist for ${profile?.biz} (${profile?.niche}) in ${profile?.city}.
${topic ? `Post topic: ${topic}` : ''}
Platform: ${platform}
Generate a complete hashtag strategy with sections for mega, mid, niche, and local tags.
Include a "BEST COMBO" section with the top tags to use together.
Also include 3 pro strategy tips.`;
    await run(async () => {
      const text = await callClaude(prompt, { maxTokens: 1200 });
      setResult(text);
    });
  }, [profile, platform, topic, onGenerate, run]);

  return (
    <View>
      <Label>PLATFORM</Label>
      <View style={st.chipRow}>
        {[['both', 'Both'], ['instagram', 'Instagram'], ['tiktok', 'TikTok']].map(([id, lbl]) => (
          <Chip key={id} label={lbl} active={platform === id} onPress={() => setPlatform(id)} />
        ))}
      </View>
      <Label>POST TOPIC (OPTIONAL)</Label>
      <Inp value={topic} onChangeText={setTopic} placeholder="e.g. Fade, beard trim, kids cut..." />
      <View style={{ height: 14 }} />
      <GenBtn onPress={generate} loading={loading} label="⚡ FIND MY HASHTAGS" testID="hashtag-gen-btn" />
      <ErrorBanner message={error} onRetry={generate} onDismiss={clearError} />
      {loading && <Spinner label="RESEARCHING HASHTAGS..." />}
      {result && !loading && !error && (
        <View style={{ marginTop: 18 }} testID="hashtag-result">
          <Card accent={C.gold}>
            <View style={st.rowBetween}>
              <Text style={[st.cardTitle, { color: C.gold }]}>🔥 YOUR HASHTAG STRATEGY</Text>
              <CopyBtn text={result} id="all" copiedId={copiedId} onCopy={copy} />
            </View>
            <Text style={[st.cardBody, { lineHeight: 22 }]}>{result}</Text>
          </Card>
          <RegenBtn onPress={generate} />
        </View>
      )}
    </View>
  );
}

// ════════════════════════════════════════════════════════════
// DM REPLIES TAB
// ════════════════════════════════════════════════════════════
export function RepliesTool({ profile, onGenerate }: ToolProps) {
  const [scenario, setScenario] = useState('booking');
  const [custom, setCustom] = useState('');
  const [replies, setReplies] = useState<any[] | null>(null);
  const { loading, error, clearError, run } = useGenerate();
  const { copiedId, copy } = useCopy();

  const SCENARIOS: [string, string][] = [
    ['booking', 'Book Appt'], ['price', 'Pricing'], ['hours', 'Hours'],
    ['collab', 'Collab'], ['complaint', 'Complaint'], ['compliment', 'Compliment'],
    ['custom', 'Custom DM'],
  ];
  const scenarioMap: Record<string, string> = {
    booking: 'someone asking how to book an appointment',
    price: 'someone asking about pricing',
    hours: 'someone asking about hours and location',
    collab: 'someone asking about collaboration or paid promo',
    complaint: 'a customer complaining about their experience',
    compliment: 'a customer complimenting the work',
    custom: `customer message: "${custom}"`,
  };

  const generate = useCallback(async () => {
    if (!(await onGenerate())) return;
    setReplies(null);
    const prompt = `Write DM replies for ${profile?.biz} (${profile?.niche}) in ${profile?.city}.
${profile?.booking ? `Booking/contact: ${profile.booking}` : ''}
Tone: Warm, bold, professional but street-smart.
Scenario: ${scenarioMap[scenario]}
Write 3 reply options:
REPLY 1 — Short & Direct (1-2 sentences)
REPLY 2 — Warm & Detailed (3-4 sentences with CTA)
REPLY 3 — Hype & Bold (energetic, emojis, excitement)
Format:
REPLY 1:
[reply]
REPLY 2:
[reply]
REPLY 3:
[reply]`;
    await run(async () => {
      const text = await callClaude(prompt, { maxTokens: 1200 });
      const r1 = text.match(/REPLY 1[:\s]*([\s\S]*?)(?=REPLY 2|$)/i)?.[1]?.trim() || '';
      const r2 = text.match(/REPLY 2[:\s]*([\s\S]*?)(?=REPLY 3|$)/i)?.[1]?.trim() || '';
      const r3 = text.match(/REPLY 3[:\s]*([\s\S]*?)$/i)?.[1]?.trim() || '';
      if (!r1 && !r2 && !r3) throw new Error("Couldn't parse the replies. Please regenerate.");
      setReplies([
        { label: 'SHORT & DIRECT', sub: 'Quick response', content: r1, color: C.textDim },
        { label: 'WARM & DETAILED', sub: 'Includes CTA', content: r2, color: C.gold },
        { label: 'HYPE & BOLD', sub: 'High energy', content: r3, color: C.ig },
      ].filter(r => r.content));
    });
  }, [profile, scenario, custom, onGenerate, run]);

  return (
    <View>
      <Label>DM SCENARIO</Label>
      <View style={st.chipRow}>
        {SCENARIOS.map(([id, lbl]) => (
          <Chip key={id} label={lbl} active={scenario === id} onPress={() => setScenario(id)} />
        ))}
      </View>
      {scenario === 'custom' && (
        <>
          <Label>PASTE CUSTOMER'S MESSAGE</Label>
          <Inp value={custom} onChangeText={setCustom} placeholder="Paste the DM you received..." multiline />
          <View style={{ height: 14 }} />
        </>
      )}
      <GenBtn onPress={generate} loading={loading} label="⚡ GENERATE REPLIES" testID="reply-gen-btn" />
      <ErrorBanner message={error} onRetry={generate} onDismiss={clearError} />
      {loading && <Spinner label="CRAFTING YOUR REPLIES..." />}
      {replies && !loading && !error && (
        <View style={{ marginTop: 18 }} testID="reply-result">
          {replies.map((r, i) => (
            <Card key={i} accent={r.color}>
              <View style={st.rowBetween}>
                <View>
                  <Text style={[st.cardTitle, { color: r.color }]}>{r.label}</Text>
                  <Text style={st.cardSub}>{r.sub}</Text>
                </View>
                <CopyBtn text={r.content} id={`r${i}`} copiedId={copiedId} onCopy={copy} small />
              </View>
              <Text style={st.cardBody}>{r.content}</Text>
            </Card>
          ))}
          <RegenBtn onPress={generate} />
        </View>
      )}
    </View>
  );
}

// ════════════════════════════════════════════════════════════
// PRICING TAB
// ════════════════════════════════════════════════════════════
export function PricingTool({ profile, onGenerate }: ToolProps) {
  const [services, setServices] = useState('');
  const [city, setCity] = useState(profile?.city || '');
  const [experience, setExperience] = useState('1-3 years');
  const [result, setResult] = useState<string | null>(null);
  const { loading, error, clearError, run } = useGenerate();
  const { copiedId, copy } = useCopy();

  const generate = useCallback(async () => {
    if (!(await onGenerate())) return;
    setResult(null);
    const prompt = `You are a barbershop business coach. Give pricing advice for a ${profile?.niche || 'barbershop'} in ${city}.
Experience level: ${experience}
Services offered: ${services || 'haircuts, fades, beard trims, shave'}
Provide:
1. Recommended price for each service based on their city and experience
2. How to raise prices without losing clients
3. Premium service packages they could offer
4. A sample service menu with prices
5. How to communicate price increases on social media
Be specific with dollar amounts. Be bold and confident in the advice.`;
    await run(async () => {
      const text = await callClaude(prompt, { maxTokens: 1200 });
      setResult(text);
    });
  }, [profile, city, experience, services, onGenerate, run]);

  return (
    <View>
      <View style={[st.banner, { borderColor: C.success + '66', backgroundColor: C.success + '11' }]}>
        <Text style={[st.bannerTitle, { color: C.success }]}>💰 PRICING COACH</Text>
        <Text style={st.bannerText}>Stop underpricing your skills — find out exactly what to charge.</Text>
      </View>
      <Label>YOUR CITY</Label>
      <Inp value={city} onChangeText={setCity} placeholder="e.g. Cleveland Ohio" />
      <View style={{ height: 14 }} />
      <Label>EXPERIENCE LEVEL</Label>
      <View style={st.chipRow}>
        {['Under 1 year', '1-3 years', '3-5 years', '5-10 years', '10+ years'].map(e => (
          <Chip key={e} label={e} active={experience === e} onPress={() => setExperience(e)} color={C.success} />
        ))}
      </View>
      <Label>YOUR SERVICES (OPTIONAL)</Label>
      <Inp value={services} onChangeText={setServices} placeholder="e.g. Bald fade, beard lineup..." multiline />
      <View style={{ height: 14 }} />
      <GenBtn onPress={generate} loading={loading} label="⚡ GET MY PRICING STRATEGY" testID="pricing-gen-btn" />
      <ErrorBanner message={error} onRetry={generate} onDismiss={clearError} />
      {loading && <Spinner label="CALCULATING YOUR PRICES..." />}
      {result && !loading && !error && (
        <View style={{ marginTop: 18 }} testID="pricing-result">
          <Card accent={C.success}>
            <View style={st.rowBetween}>
              <Text style={[st.cardTitle, { color: C.success }]}>💰 YOUR PRICING STRATEGY</Text>
              <CopyBtn text={result} id="pricing" copiedId={copiedId} onCopy={copy} small />
            </View>
            <Text style={[st.cardBody, { lineHeight: 22 }]}>{result}</Text>
          </Card>
          <RegenBtn onPress={generate} />
        </View>
      )}
    </View>
  );
}

// ════════════════════════════════════════════════════════════
// Result card helper
// ════════════════════════════════════════════════════════════
function ResultCard({ accent, label, content, id, copiedId, copy }: any) {
  return (
    <Card accent={accent}>
      <View style={st.rowBetween}>
        <Text style={[st.cardTitle, { color: accent }]}>{label}</Text>
        <CopyBtn text={content} id={id} copiedId={copiedId} onCopy={copy} />
      </View>
      <Text style={st.cardBody}>{content}</Text>
    </Card>
  );
}

const st = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { fontFamily: FONTS.display, letterSpacing: 1.5, fontSize: 13 },
  cardSub: { color: C.textFaint, fontSize: 11, marginTop: 2, fontFamily: FONTS.body },
  cardBody: { color: '#ddd', lineHeight: 20, fontSize: 13, fontFamily: FONTS.body, marginTop: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  tagText: { fontFamily: FONTS.display, fontSize: 10, letterSpacing: 1 },
  scriptBox: {
    backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: C.border,
    borderRadius: RADIUS.sm, padding: 12,
  },
  hookBox: {
    backgroundColor: C.tt + '11', borderWidth: 1, borderColor: C.tt + '44',
    borderRadius: RADIUS.md, padding: 14, marginBottom: 14,
  },
  hookLabel: { color: C.tt, fontFamily: FONTS.display, fontSize: 11, letterSpacing: 2, marginBottom: 6 },
  hookText: { color: '#fff', fontSize: 17, fontFamily: FONTS.bodyBold, lineHeight: 23 },
  banner: {
    borderWidth: 1, borderRadius: RADIUS.md, padding: 14, marginBottom: 16,
  },
  bannerTitle: { fontFamily: FONTS.display, fontSize: 13, letterSpacing: 2, marginBottom: 4 },
  bannerText: { color: C.textMute, fontSize: 12, fontFamily: FONTS.body, lineHeight: 18 },
});
