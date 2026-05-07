// Image + Tracker + Refer + Help tools
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Alert, Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import {
  Inp, Label, Chip, Card, CopyBtn, GenBtn, RegenBtn, Spinner, ErrorBanner,
  useGenerate, useCopy,
} from './ui';
import { C, FONTS, RADIUS } from '../lib/theme';
import { Profile, store } from '../lib/store';
import { callClaude, listPosts, createPost, deletePost, TrackedPost } from '../lib/api';

type ToolProps = { profile: Profile | null; onGenerate: () => Promise<boolean> };

// Helper: pick image and return base64
async function pickImage(): Promise<{ base64: string; uri: string } | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permission needed', 'We need photo library access to upload images.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 0.6,
    base64: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const a = result.assets[0];
  if (!a.base64) {
    Alert.alert('Error', 'Failed to read image data.');
    return null;
  }
  // Validate size (~5MB)
  if (a.base64.length > 7_000_000) {
    Alert.alert('Image too large', 'Please choose a smaller image (under 5MB).');
    return null;
  }
  return { base64: a.base64, uri: a.uri };
}

// ════════════════════════════════════════════════════════════
// PHOTO CAPTION TAB
// ════════════════════════════════════════════════════════════
export function PhotoTool({ profile, onGenerate }: ToolProps) {
  const [img, setImg] = useState<{ base64: string; uri: string } | null>(null);
  const [platform, setPlatform] = useState('both');
  const [extra, setExtra] = useState('');
  const [result, setResult] = useState<any>(null);
  const { loading, error, clearError, run } = useGenerate();
  const { copiedId, copy } = useCopy();

  const handlePick = async () => {
    const r = await pickImage();
    if (r) { setImg(r); setResult(null); }
  };

  const generate = useCallback(async () => {
    if (!img) return;
    if (!(await onGenerate())) return;
    setResult(null);
    const platInstr: Record<string, string> = {
      instagram: 'Write an Instagram caption with 10-15 hashtags.',
      tiktok: 'Write a TikTok caption with hook line and 8 hashtags.',
      both: 'Write both. Format:\n📸 INSTAGRAM:\n[caption+hashtags]\n\n🎵 TIKTOK:\n[hook+caption+hashtags]',
    };
    const prompt = `You are a bold social media expert for ${profile?.biz || 'a barbershop'} in ${profile?.city || ''}.
Look at this haircut/barbershop photo and write an amazing social media caption.
Tone: Bold, edgy, confident. Goal: drive bookings and engagement.
${extra ? `Extra context: ${extra}` : ''}
${profile?.booking ? `Always include CTA with: ${profile.booking}` : ''}
${platInstr[platform]}`;

    await run(async () => {
      const text = await callClaude(prompt, { maxTokens: 1200, images: [img.base64] });
      if (platform === 'both') {
        const ig = text.match(/📸\s*INSTAGRAM[:\s]*([\s\S]*?)(?=🎵\s*TIKTOK|$)/i)?.[1]?.trim() || text;
        const tt = text.match(/🎵\s*TIKTOK[:\s]*([\s\S]*?)$/i)?.[1]?.trim() || '';
        setResult({ type: 'dual', ig, tt });
      } else {
        setResult({ type: 'single', content: text.trim(), platform });
      }
    });
  }, [img, platform, extra, profile, onGenerate, run]);

  return (
    <View>
      <View style={st.banner}>
        <Text style={[st.bannerTitle, { color: C.gold }]}>📸 AI PHOTO CAPTION</Text>
        <Text style={st.bannerText}>Upload a photo — AI reads it and writes the perfect caption.</Text>
      </View>

      <TouchableOpacity onPress={handlePick} testID="photo-pick-btn" style={[st.upload, img && { borderColor: C.gold }]}>
        {img ? (
          <Image source={{ uri: img.uri }} style={st.preview} />
        ) : (
          <View style={st.uploadEmpty}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>📷</Text>
            <Text style={st.uploadLabel}>TAP TO UPLOAD PHOTO</Text>
            <Text style={st.uploadHint}>Fresh cut, beard trim, shop photo</Text>
          </View>
        )}
      </TouchableOpacity>

      {img && (
        <TouchableOpacity onPress={() => { setImg(null); setResult(null); clearError(); }} style={st.removeBtn}>
          <Text style={st.removeText}>✕ REMOVE PHOTO</Text>
        </TouchableOpacity>
      )}

      <Label>PLATFORM</Label>
      <View style={st.chipRow}>
        {[['both', 'Both'], ['instagram', 'Instagram'], ['tiktok', 'TikTok']].map(([id, lbl]) => (
          <Chip key={id} label={lbl} active={platform === id} onPress={() => setPlatform(id)} />
        ))}
      </View>
      <Label>ADD CONTEXT (OPTIONAL)</Label>
      <Inp value={extra} onChangeText={setExtra} placeholder="e.g. Bald fade on curly hair, first visit..." />
      <View style={{ height: 14 }} />
      <GenBtn onPress={generate} loading={loading} disabled={!img} label="⚡ GENERATE CAPTION" testID="photo-gen-btn" />
      {!img && <Text style={st.helper}>Upload a photo first to generate</Text>}
      <ErrorBanner message={error} onRetry={img ? generate : null} onDismiss={clearError} />
      {loading && <Spinner label="READING YOUR PHOTO..." />}
      {result && !loading && !error && (
        <View style={{ marginTop: 18 }} testID="photo-result">
          {result.type === 'dual' && (
            <>
              <ResultCard accent={C.ig} label="📸 INSTAGRAM" content={result.ig} id="pig" copiedId={copiedId} copy={copy} />
              <ResultCard accent={C.tt} label="🎵 TIKTOK" content={result.tt} id="ptt" copiedId={copiedId} copy={copy} />
            </>
          )}
          {result.type === 'single' && (
            <ResultCard
              accent={result.platform === 'instagram' ? C.ig : C.tt}
              label={result.platform === 'instagram' ? '📸 INSTAGRAM' : '🎵 TIKTOK'}
              content={result.content} id="ps" copiedId={copiedId} copy={copy}
            />
          )}
          <RegenBtn onPress={generate} />
        </View>
      )}
    </View>
  );
}

// ════════════════════════════════════════════════════════════
// BEFORE & AFTER TAB
// ════════════════════════════════════════════════════════════
export function BeforeAfterTool({ profile, onGenerate }: ToolProps) {
  const [before, setBefore] = useState<{ base64: string; uri: string } | null>(null);
  const [after, setAfter] = useState<{ base64: string; uri: string } | null>(null);
  const [platform, setPlatform] = useState('both');
  const [service, setService] = useState('');
  const [result, setResult] = useState<any>(null);
  const { loading, error, clearError, run } = useGenerate();
  const { copiedId, copy } = useCopy();

  const pickFor = async (which: 'before' | 'after') => {
    const r = await pickImage();
    if (r) { which === 'before' ? setBefore(r) : setAfter(r); setResult(null); }
  };

  const generate = useCallback(async () => {
    if (!before || !after) return;
    if (!(await onGenerate())) return;
    setResult(null);
    const platInstr: Record<string, string> = {
      instagram: 'Write an Instagram before & after caption with 12 hashtags.',
      tiktok: 'Write a TikTok before & after caption with viral hook and 8 hashtags.',
      both: 'Write both. Format:\n📸 INSTAGRAM:\n[content]\n\n🎵 TIKTOK:\n[content]',
    };
    const prompt = `You are a bold social media expert for ${profile?.biz || 'a barbershop'} in ${profile?.city || ''}.
The FIRST image is the BEFORE. The SECOND image is the AFTER.
${service ? `Service performed: ${service}` : 'Look at both images and describe the transformation.'}
Write an incredible before & after transformation post. Make it dramatic and exciting.
Tone: Bold, edgy, hype. Show the skill and transformation. Drive bookings.
${profile?.booking ? `Include CTA: ${profile.booking}` : ''}
${platInstr[platform]}`;

    await run(async () => {
      const text = await callClaude(prompt, {
        maxTokens: 1200,
        images: [before.base64, after.base64],
      });
      if (platform === 'both') {
        const ig = text.match(/📸\s*INSTAGRAM[:\s]*([\s\S]*?)(?=🎵\s*TIKTOK|$)/i)?.[1]?.trim() || text;
        const tt = text.match(/🎵\s*TIKTOK[:\s]*([\s\S]*?)$/i)?.[1]?.trim() || '';
        setResult({ type: 'dual', ig, tt });
      } else {
        setResult({ type: 'single', content: text.trim(), platform });
      }
    });
  }, [before, after, platform, service, profile, onGenerate, run]);

  return (
    <View>
      <View style={st.banner}>
        <Text style={[st.bannerTitle, { color: C.gold }]}>🖼️ BEFORE & AFTER</Text>
        <Text style={st.bannerText}>Upload before + after photos. AI writes the perfect transformation post.</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        {(['before', 'after'] as const).map(w => {
          const img = w === 'before' ? before : after;
          return (
            <TouchableOpacity
              key={w}
              onPress={() => pickFor(w)}
              testID={`pick-${w}-btn`}
              style={[st.uploadHalf, img && { borderColor: C.gold }]}>
              {img ? (
                <Image source={{ uri: img.uri }} style={st.previewHalf} />
              ) : (
                <View style={st.uploadEmpty}>
                  <Text style={{ fontSize: 26, marginBottom: 4 }}>{w === 'before' ? '😐' : '😎'}</Text>
                  <Text style={st.uploadLabelSm}>{w.toUpperCase()}</Text>
                  <Text style={st.uploadHintSm}>Tap to upload</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      {(before || after) && (
        <TouchableOpacity
          onPress={() => { setBefore(null); setAfter(null); setResult(null); clearError(); }}
          style={st.removeBtn}>
          <Text style={st.removeText}>✕ CLEAR BOTH</Text>
        </TouchableOpacity>
      )}
      <Label>PLATFORM</Label>
      <View style={st.chipRow}>
        {[['both', 'Both'], ['instagram', 'Instagram'], ['tiktok', 'TikTok']].map(([id, lbl]) => (
          <Chip key={id} label={lbl} active={platform === id} onPress={() => setPlatform(id)} />
        ))}
      </View>
      <Label>SERVICE PERFORMED (OPTIONAL)</Label>
      <Inp value={service} onChangeText={setService} placeholder="e.g. Bald fade, beard lineup..." />
      <View style={{ height: 14 }} />
      <GenBtn onPress={generate} loading={loading} disabled={!before || !after} label="⚡ GENERATE TRANSFORMATION" testID="ba-gen-btn" />
      {(!before || !after) && <Text style={st.helper}>Upload BOTH photos to generate</Text>}
      <ErrorBanner message={error} onRetry={(before && after) ? generate : null} onDismiss={clearError} />
      {loading && <Spinner label="ANALYZING TRANSFORMATION..." />}
      {result && !loading && !error && (
        <View style={{ marginTop: 18 }} testID="ba-result">
          {result.type === 'dual' && (
            <>
              <ResultCard accent={C.ig} label="📸 INSTAGRAM" content={result.ig} id="big" copiedId={copiedId} copy={copy} />
              <ResultCard accent={C.tt} label="🎵 TIKTOK" content={result.tt} id="btt" copiedId={copiedId} copy={copy} />
            </>
          )}
          {result.type === 'single' && (
            <ResultCard
              accent={result.platform === 'instagram' ? C.ig : C.tt}
              label={result.platform === 'instagram' ? '📸 INSTAGRAM' : '🎵 TIKTOK'}
              content={result.content} id="bs" copiedId={copiedId} copy={copy}
            />
          )}
          <RegenBtn onPress={generate} />
        </View>
      )}
    </View>
  );
}

// ════════════════════════════════════════════════════════════
// TRACKER TAB
// ════════════════════════════════════════════════════════════
export function TrackerTool({ profile, onGenerate }: ToolProps) {
  const [posts, setPosts] = useState<TrackedPost[]>([]);
  const [deviceId, setDeviceId] = useState('');
  const [form, setForm] = useState({
    platform: 'instagram', type: 'Daily Post',
    likes: '', comments: '', reach: '', topic: '',
  });
  const [analysis, setAnalysis] = useState<string | null>(null);
  const { loading, error, clearError, run } = useGenerate();
  const { copiedId, copy } = useCopy();

  const TYPES = ['Daily Post', 'Hook', 'Promo', 'Before & After', 'TikTok Script', 'Reel', 'Story'];

  useEffect(() => {
    (async () => {
      const id = await store.getDeviceId();
      setDeviceId(id);
      const list = await listPosts(id);
      setPosts(list);
    })();
  }, []);

  const savePost = async () => {
    if (!form.topic || !form.likes) return;
    try {
      const created = await createPost({
        device_id: deviceId,
        platform: form.platform,
        type: form.type,
        topic: form.topic,
        likes: form.likes,
        comments: form.comments || '0',
        reach: form.reach || '0',
      });
      setPosts(p => [created, ...p]);
      setForm({ platform: 'instagram', type: 'Daily Post', likes: '', comments: '', reach: '', topic: '' });
    } catch {
      Alert.alert('Error', 'Could not save post.');
    }
  };

  const remove = async (id: string) => {
    await deletePost(id, deviceId);
    setPosts(p => p.filter(x => x.id !== id));
  };

  const analyze = useCallback(async () => {
    if (posts.length < 2) return;
    if (!(await onGenerate())) return;
    setAnalysis(null);
    const prompt = `Analyze these social media post results for ${profile?.biz || 'a barbershop'}:
${posts.map(p => `- ${p.platform} ${p.type}: "${p.topic}" | Likes: ${p.likes} | Comments: ${p.comments || 0} | Reach: ${p.reach || '?'}`).join('\n')}
Tell them:
1. Which content type is performing best
2. Which platform is winning
3. What topics get most engagement
4. Exactly what to post more of
5. What to stop posting
Be specific, bold, and actionable. Use their actual numbers.`;
    await run(async () => {
      const text = await callClaude(prompt, { maxTokens: 1000 });
      setAnalysis(text);
    });
  }, [posts, profile, onGenerate, run]);

  const formValid = !!form.topic && !!form.likes;

  return (
    <View>
      <View style={[st.banner, { borderColor: C.purple + '66', backgroundColor: C.purple + '11' }]}>
        <Text style={[st.bannerTitle, { color: C.purple }]}>📊 PERFORMANCE TRACKER</Text>
        <Text style={st.bannerText}>Log your post results — AI learns what works for YOUR audience.</Text>
      </View>

      <View style={st.formCard}>
        <Text style={[st.cardTitle, { color: C.textMute, marginBottom: 12 }]}>LOG A POST</Text>
        <View style={st.chipRow}>
          {[['instagram', '📸 IG'], ['tiktok', '🎵 TT']].map(([id, lbl]) => (
            <Chip key={id} label={lbl} active={form.platform === id}
              onPress={() => setForm({ ...form, platform: id })}
              color={id === 'instagram' ? C.ig : C.tt} />
          ))}
        </View>
        <View style={st.chipRow}>
          {TYPES.map(t => (
            <Chip key={t} label={t} active={form.type === t} onPress={() => setForm({ ...form, type: t })} />
          ))}
        </View>
        <Inp value={form.topic} onChangeText={(v) => setForm({ ...form, topic: v })} placeholder="Post topic (e.g. Bald fade)" testID="track-topic" />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <View style={{ flex: 1 }}><Label>LIKES</Label>
            <Inp value={form.likes} onChangeText={(v) => setForm({ ...form, likes: v.replace(/[^0-9]/g, '') })} placeholder="0" keyboardType="numeric" testID="track-likes" />
          </View>
          <View style={{ flex: 1 }}><Label>COMMENTS</Label>
            <Inp value={form.comments} onChangeText={(v) => setForm({ ...form, comments: v.replace(/[^0-9]/g, '') })} placeholder="0" keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}><Label>REACH</Label>
            <Inp value={form.reach} onChangeText={(v) => setForm({ ...form, reach: v.replace(/[^0-9]/g, '') })} placeholder="0" keyboardType="numeric" />
          </View>
        </View>
        <TouchableOpacity
          onPress={savePost}
          disabled={!formValid}
          testID="track-save-btn"
          style={[st.logBtn, !formValid && { backgroundColor: C.surface2 }]}>
          <Text style={[st.logBtnText, !formValid && { color: C.textFaint }]}>+ LOG THIS POST</Text>
        </TouchableOpacity>
      </View>

      {posts.length >= 2 ? (
        <GenBtn onPress={analyze} loading={loading} label="🧠 ANALYZE MY PERFORMANCE" testID="analyze-btn" />
      ) : (
        <Text style={st.helper}>Log at least 2 posts to get AI analysis</Text>
      )}
      <ErrorBanner message={error} onRetry={posts.length >= 2 ? analyze : null} onDismiss={clearError} />
      {loading && <Spinner label="ANALYZING YOUR DATA..." />}
      {analysis && !loading && !error && (
        <Card accent={C.purple} style={{ marginTop: 14 }}>
          <View style={st.rowBetween}>
            <Text style={[st.cardTitle, { color: C.purple }]}>🧠 AI ANALYSIS</Text>
            <CopyBtn text={analysis} id="ana" copiedId={copiedId} onCopy={copy} small />
          </View>
          <Text style={st.cardBody}>{analysis}</Text>
        </Card>
      )}

      {posts.length > 0 && (
        <View style={{ marginTop: 18 }}>
          <Text style={st.sectionTitle}>YOUR LOGGED POSTS ({posts.length})</Text>
          {posts.map(p => (
            <View key={p.id} style={st.postRow} testID={`post-${p.id}`}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
                  <View style={[st.tag, { backgroundColor: (p.platform === 'instagram' ? C.ig : C.tt) + '22' }]}>
                    <Text style={[st.tagText, { color: p.platform === 'instagram' ? C.ig : C.tt }]}>{p.platform.toUpperCase()}</Text>
                  </View>
                  <View style={[st.tag, { backgroundColor: C.purple + '22' }]}>
                    <Text style={[st.tagText, { color: C.purple }]}>{p.type}</Text>
                  </View>
                </View>
                <Text style={{ color: C.white, fontSize: 13, fontFamily: FONTS.body }}>{p.topic}</Text>
                <Text style={{ color: C.textMute, fontSize: 11, fontFamily: FONTS.body, marginTop: 2 }}>
                  ❤️ {p.likes} · 💬 {p.comments || 0} · 👁 {p.reach || '?'} · {p.date}
                </Text>
              </View>
              <TouchableOpacity onPress={() => remove(p.id)} testID={`del-${p.id}`}>
                <Text style={{ color: C.textDim, fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ════════════════════════════════════════════════════════════
// REFER TAB
// ════════════════════════════════════════════════════════════
export function ReferTool({ profile }: { profile: Profile | null }) {
  const { copiedId, copy } = useCopy();
  const [linkCopied, setLinkCopied] = useState(false);
  const APP_LINK = 'https://clipmasterpro.app';
  const referLink = `${APP_LINK}?ref=${(profile?.biz || 'friend').toLowerCase().replace(/\s+/g, '')}`;

  const copyLink = async () => {
    await Clipboard.setStringAsync(referLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const messages = [
    { label: '📱 TEXT MESSAGE', color: C.success, content: `Yo! I've been using this AI tool called ClipMaster Pro for my barbershop — it writes all my Instagram and TikTok content automatically. Only $4.99/mo. Check it out: ${referLink}` },
    { label: '📸 INSTAGRAM DM', color: C.ig, content: `Hey! You need to check out ClipMaster Pro 💈 It's an AI tool that writes all your social media captions, TikTok scripts, hashtags and DM replies automatically. Only $4.99/mo — I've been using it for my shop and it's 🔥 ${referLink}` },
    { label: '🎵 TIKTOK / GROUP', color: C.tt, content: `Barbers & stylists — stop spending hours on social media 🛑 I found ClipMaster Pro that does it all for you. Daily posts, TikTok scripts, hashtags, DM replies — automated. $4.99/mo. ${referLink} 💈🔥` },
    { label: '📘 FACEBOOK GROUP', color: '#1877F2', content: `Fellow barbers — wanted to share a tool I've been using called ClipMaster Pro. AI-powered social media automation built for barbers, stylists, beauty pros. Writes captions, TikTok scripts, hashtags, DM replies in seconds. $4.99/mo. ${referLink}` },
  ];

  return (
    <View>
      <View style={st.referHero}>
        <Text style={{ fontSize: 38, marginBottom: 8 }}>🤝</Text>
        <Text style={st.referTitle}>REFER A FRIEND</Text>
        <Text style={st.referSub}>Know a barber, stylist, or beauty pro who needs this?{'\n'}Share ClipMaster Pro and grow together.</Text>
        <View style={st.rewardBox}>
          <Text style={[st.cardTitle, { color: C.success }]}>🎁 REFERRAL REWARD</Text>
          <Text style={st.referReward}>For every friend who subscribes,{'\n'}<Text style={{ color: C.white, fontFamily: FONTS.bodyBold }}>you get 1 month FREE</Text></Text>
        </View>
        <Text style={[st.sectionTitle, { textAlign: 'center', marginTop: 4 }]}>YOUR REFERRAL LINK</Text>
        <View style={st.linkBox}>
          <Text style={st.linkText} numberOfLines={1}>{referLink}</Text>
        </View>
        <TouchableOpacity
          onPress={copyLink}
          testID="copy-referral-link"
          style={[st.copyLinkBtn, linkCopied && { backgroundColor: C.success + '22', borderColor: C.success, borderWidth: 1 }]}>
          <Text style={[st.copyLinkText, linkCopied && { color: C.success }]}>
            {linkCopied ? '✓ LINK COPIED!' : '📋 COPY MY REFERRAL LINK'}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={st.sectionTitle}>📨 READY-TO-SEND MESSAGES</Text>
      {messages.map((m, i) => (
        <Card key={i} accent={m.color}>
          <View style={st.rowBetween}>
            <Text style={[st.cardTitle, { color: m.color }]}>{m.label}</Text>
            <CopyBtn text={m.content} id={`ref-${i}`} copiedId={copiedId} onCopy={copy} small />
          </View>
          <Text style={st.cardBody}>{m.content}</Text>
        </Card>
      ))}
    </View>
  );
}

// ════════════════════════════════════════════════════════════
// HELP TAB
// ════════════════════════════════════════════════════════════
export function HelpTool() {
  const [open, setOpen] = useState<number | null>(0);
  const sections = [
    {
      icon: '🚀', title: 'GETTING STARTED', steps: [
        { label: 'Step 1 — Onboarding', desc: 'Enter your name, business, niche, city, booking link. This personalizes every piece of content.' },
        { label: 'Step 2 — Pick a Tool', desc: 'Tap any tile on the home hub to open that tool.' },
        { label: 'Step 3 — Generate', desc: 'Pick options, optionally add a focus topic, then tap GENERATE. Content appears in seconds.' },
        { label: 'Step 4 — Copy & Post', desc: 'Tap COPY next to any content, then paste into Instagram, TikTok, or your scheduler.' },
      ],
    },
    {
      icon: '✂️', title: 'CONTENT GENERATOR', steps: [
        { label: 'Daily Post', desc: 'Generates one ready-to-post caption for today.' },
        { label: 'Hook', desc: 'Creates an attention-grabbing opening line.' },
        { label: 'Promo', desc: 'Generates a promotional post. Type your deal in the focus box.' },
        { label: 'Full Week Pack', desc: '7 complete posts at once — one per day.' },
      ],
    },
    {
      icon: '📸', title: 'PHOTO CAPTION & BEFORE/AFTER', steps: [
        { label: 'Photo Caption', desc: 'Tap upload. AI reads the photo and writes a perfect caption.' },
        { label: 'Before & After', desc: 'Upload BOTH photos. AI describes the transformation dramatically.' },
      ],
    },
    {
      icon: '🎬', title: 'TIKTOK SCRIPT WRITER', steps: [
        { label: 'How to film it', desc: 'Say the HOOK on camera first. Follow the SCRIPT. Add ON-SCREEN TEXT in TikTok\'s editor.' },
      ],
    },
    {
      icon: '📊', title: 'PERFORMANCE TRACKER', steps: [
        { label: 'Log your posts', desc: 'Add likes, comments, reach for each post you publish.' },
        { label: 'Run AI analysis', desc: 'After 2+ posts, tap ANALYZE — AI tells you exactly what to post more of.' },
      ],
    },
  ];

  return (
    <View>
      <View style={[st.banner, { borderColor: C.gold + '44', backgroundColor: C.gold + '0c' }]}>
        <Text style={[st.bannerTitle, { color: C.gold }]}>💈 HOW TO USE CLIPMASTER PRO</Text>
        <Text style={st.bannerText}>Tap any section below to learn how each tool works.</Text>
      </View>
      {sections.map((sec, i) => {
        const isOpen = open === i;
        return (
          <View key={i} style={{ marginBottom: 8 }}>
            <TouchableOpacity
              onPress={() => setOpen(isOpen ? null : i)}
              style={[st.helpHeader, isOpen && { borderColor: C.gold }]}>
              <Text style={[st.cardTitle, { color: isOpen ? C.gold : C.white }]}>{sec.icon} {sec.title}</Text>
              <Text style={{ color: C.textDim, fontSize: 14 }}>{isOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {isOpen && (
              <View style={st.helpBody}>
                {sec.steps.map((s, j) => (
                  <View key={j} style={[st.helpStep, j < sec.steps.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.borderDim }]}>
                    <Text style={[st.cardTitle, { color: C.gold, fontSize: 11 }]}>{s.label}</Text>
                    <Text style={[st.cardBody, { marginTop: 4 }]}>{s.desc}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

// Result card helper
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
  cardBody: { color: '#ddd', lineHeight: 20, fontSize: 13, fontFamily: FONTS.body, marginTop: 6 },
  banner: {
    backgroundColor: C.gold + '11', borderWidth: 1, borderColor: C.gold + '44',
    borderRadius: RADIUS.md, padding: 14, marginBottom: 16,
  },
  bannerTitle: { fontFamily: FONTS.display, fontSize: 13, letterSpacing: 2, marginBottom: 4 },
  bannerText: { color: C.textMute, fontSize: 12, fontFamily: FONTS.body, lineHeight: 18 },
  upload: {
    borderWidth: 2, borderColor: C.border, borderStyle: 'dashed',
    borderRadius: RADIUS.md, marginBottom: 14, overflow: 'hidden',
    backgroundColor: '#0a0a0a',
  },
  uploadEmpty: { padding: 36, alignItems: 'center' },
  uploadLabel: { fontFamily: FONTS.display, color: C.textMute, fontSize: 13, letterSpacing: 2, marginBottom: 4 },
  uploadHint: { color: C.textFaint, fontSize: 11, fontFamily: FONTS.body },
  preview: { width: '100%', height: 240 },
  uploadHalf: {
    flex: 1, borderWidth: 2, borderColor: C.border, borderStyle: 'dashed',
    borderRadius: RADIUS.md, overflow: 'hidden', backgroundColor: '#0a0a0a',
    minHeight: 130,
  },
  previewHalf: { width: '100%', height: 160 },
  uploadLabelSm: { fontFamily: FONTS.display, color: C.textMute, fontSize: 11, letterSpacing: 1 },
  uploadHintSm: { color: C.textFaint, fontSize: 10, fontFamily: FONTS.body, marginTop: 2 },
  removeBtn: {
    alignSelf: 'flex-start', marginBottom: 12,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6,
    borderWidth: 1, borderColor: C.border,
  },
  removeText: { color: C.textDim, fontSize: 11, fontFamily: FONTS.display, letterSpacing: 1 },
  helper: { color: C.textMute, fontSize: 11, textAlign: 'center', marginTop: 8, fontFamily: FONTS.body },
  formCard: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: RADIUS.md, padding: 14, marginBottom: 14,
  },
  logBtn: {
    backgroundColor: C.purple, borderRadius: RADIUS.md,
    paddingVertical: 13, alignItems: 'center', marginTop: 12,
  },
  logBtnText: { color: C.white, fontFamily: FONTS.display, fontSize: 14, letterSpacing: 2 },
  postRow: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: RADIUS.md, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8,
  },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  tagText: { fontFamily: FONTS.display, fontSize: 10, letterSpacing: 1 },
  sectionTitle: {
    fontFamily: FONTS.display, color: C.textMute, fontSize: 12, letterSpacing: 2, marginBottom: 10,
  },
  referHero: {
    backgroundColor: C.surface, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: C.gold + '44',
    padding: 22, marginBottom: 18, alignItems: 'center',
  },
  referTitle: { fontFamily: FONTS.display, fontSize: 26, letterSpacing: 3, color: C.gold, marginBottom: 8 },
  referSub: { color: C.textMute, fontSize: 13, fontFamily: FONTS.body, lineHeight: 20, textAlign: 'center', marginBottom: 18 },
  rewardBox: {
    backgroundColor: C.success + '15', borderWidth: 1, borderColor: C.success + '44',
    borderRadius: RADIUS.md, padding: 14, alignItems: 'center', marginBottom: 18, width: '100%',
  },
  referReward: { color: '#bbb', fontSize: 13, fontFamily: FONTS.body, marginTop: 4, textAlign: 'center' },
  linkBox: {
    backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: C.border,
    borderRadius: RADIUS.sm, padding: 10, marginBottom: 12, width: '100%',
  },
  linkText: { color: C.gold, fontSize: 12, fontFamily: FONTS.body },
  copyLinkBtn: {
    backgroundColor: C.gold, borderRadius: RADIUS.md,
    paddingVertical: 14, paddingHorizontal: 24, width: '100%', alignItems: 'center',
  },
  copyLinkText: { color: '#000', fontFamily: FONTS.display, fontSize: 16, letterSpacing: 2 },
  helpHeader: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: RADIUS.md, padding: 14, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  helpBody: {
    backgroundColor: C.surface2, borderWidth: 1, borderColor: C.gold,
    borderTopWidth: 0, borderBottomLeftRadius: RADIUS.md, borderBottomRightRadius: RADIUS.md,
    marginTop: -1,
  },
  helpStep: { paddingVertical: 12, paddingHorizontal: 14 },
});
