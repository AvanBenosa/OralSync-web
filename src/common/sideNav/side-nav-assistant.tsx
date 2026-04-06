import { keyframes } from '@emotion/react';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import StopCircleRoundedIcon from '@mui/icons-material/StopCircleRounded';
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useEffect, useMemo, useRef, useState } from 'react';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';

import { GetCurrentClinicProfile } from '../../features/settings/clinic-profile/api/api';
import { ClinicProfileModel } from '../../features/settings/clinic-profile/api/types';
import useSpeechRecognition from '../hooks/use-speech-recognition';
import useSpeechSynthesis from '../hooks/use-speech-synthesis';
import { sendAiAssistantMessage } from '../services/ai-assistant-api';
import { useAiAssistantStore } from '../store/aiAssistantStore';
import { useAuthStore } from '../store/authStore';
import { runVoiceAssistantCommand } from '../utils/voice-commands';
import {
  formatSubscriptionValidityDate,
  getSubscriptionDaysRemaining,
  normalizeSubscriptionType,
} from '../utils/subscription';

type SideNavAssistantProps = {
  drawerOpen: boolean;
};

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  mode?: 'static' | 'ai';
};

const expandedDrawerOffset = 240;
const collapsedDrawerOffset = 72;

const floatMotion = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
`;

const glowPulse = keyframes`
  0%, 100% { box-shadow: 0 12px 24px rgba(9, 40, 20, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.6); }
  50% { box-shadow: 0 16px 30px rgba(31, 104, 58, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.8); }
`;

const blinkMotion = keyframes`
  0%, 45%, 100% { transform: scaleY(1); }
  48%, 52% { transform: scaleY(0.12); }
`;

const createAssistantMessage = (
  content: string,
  mode: 'static' | 'ai' = 'static'
): ChatMessage => ({
  id: `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role: 'assistant',
  content,
  mode,
});

const createUserMessage = (content: string): ChatMessage => ({
  id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role: 'user',
  content,
});

const OPENING_GREETING = "Hey, I'm Ora. What can I do for you?";

const formatPlanLabel = (value?: string | null): string => {
  const normalized = normalizeSubscriptionType(value);
  if (!normalized) {
    return 'Not set';
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const formatTimeLabel = (value?: string): string => {
  const normalized = value?.trim();
  if (!normalized) {
    return '--';
  }

  const match = normalized.match(/^(\d{1,2}):(\d{2})/);
  if (!match) {
    return normalized;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const referenceDate = new Date();
  referenceDate.setHours(hour, minute, 0, 0);

  return referenceDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const buildClinicHoursSummary = (clinicProfile?: ClinicProfileModel | null): string => {
  if (!clinicProfile) {
    return 'Clinic hours are not loaded yet. Open Settings > Clinic Profile to verify the schedule.';
  }

  const workingDays = clinicProfile.workingDays?.length
    ? clinicProfile.workingDays.join(', ')
    : 'Monday to Friday';

  return `${
    clinicProfile.clinicName || 'Your clinic'
  } is open on ${workingDays}. Clinic hours are ${formatTimeLabel(
    clinicProfile.openingTime
  )} to ${formatTimeLabel(clinicProfile.closingTime)}, with lunch break from ${formatTimeLabel(
    clinicProfile.lunchStartTime
  )} to ${formatTimeLabel(clinicProfile.lunchEndTime)}.`;
};

const buildSubscriptionSummary = (
  clinicProfile?: ClinicProfileModel | null,
  fallbackSubscriptionType?: string,
  fallbackValidityDate?: string
): string => {
  const subscriptionType = clinicProfile?.subscriptionType || fallbackSubscriptionType;
  const validityDate = clinicProfile?.validityDate || fallbackValidityDate;
  const formattedDate = formatSubscriptionValidityDate(validityDate);
  const daysRemaining = getSubscriptionDaysRemaining(validityDate);
  const planLabel = formatPlanLabel(subscriptionType);

  if (daysRemaining == null) {
    return `Current subscription is ${planLabel}. Validity date is not set yet.`;
  }

  if (daysRemaining < 0) {
    return `Current subscription is ${planLabel}. It expired ${Math.abs(
      daysRemaining
    )} day(s) ago on ${formattedDate}.`;
  }

  return `Current subscription is ${planLabel}. It is valid until ${formattedDate}, with ${daysRemaining} day(s) remaining.`;
};

const buildClinicContactSummary = (clinicProfile?: ClinicProfileModel | null): string => {
  if (!clinicProfile) {
    return 'Clinic contact details are not loaded yet.';
  }

  const parts = [
    clinicProfile.clinicName?.trim() || 'Your clinic',
    clinicProfile.address?.trim() ? `Address: ${clinicProfile.address.trim()}` : '',
    clinicProfile.contactNumber?.trim() ? `Phone: ${clinicProfile.contactNumber.trim()}` : '',
    clinicProfile.emailAddress?.trim() ? `Email: ${clinicProfile.emailAddress.trim()}` : '',
  ].filter(Boolean);

  return parts.join(' | ');
};

const buildClinicStatsSummary = (clinicProfile?: ClinicProfileModel | null): string => {
  if (!clinicProfile) {
    return 'Clinic stats are not loaded yet.';
  }

  return `Current clinic snapshot: ${clinicProfile.patientCount ?? 0} patients, ${
    clinicProfile.userCount ?? 0
  } users, and ${clinicProfile.uploadedFileCount ?? 0} uploaded files.`;
};

const buildStaticCapabilitiesSummary = (hasPatientContext: boolean): string =>
  hasPatientContext
    ? 'I can answer local clinic questions here and also try patient-aware AI replies when OpenAI is available. Try: current subscription, clinic hours, clinic contact, clinic stats, or summarize this patient.'
    : 'I can answer local clinic questions here and also try AI replies when OpenAI is available. Try: current subscription, clinic hours, clinic contact, clinic stats, or what can you help with.';

const resolveStaticReply = (
  input: string,
  clinicProfile: ClinicProfileModel | null,
  subscriptionType?: string,
  validityDate?: string,
  hasPatientContext: boolean = false
): string | null => {
  const normalized = input.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  const includesAny = (...terms: string[]) =>
    terms.some((term) => normalized.includes(term.toLowerCase()));

  if (includesAny('subscription', 'plan', 'validity', 'expire', 'current subscitpon')) {
    return buildSubscriptionSummary(clinicProfile, subscriptionType, validityDate);
  }

  if (includesAny('clinic hours', 'hours', 'open', 'close', 'schedule', 'working days', 'lunch')) {
    return buildClinicHoursSummary(clinicProfile);
  }

  if (
    includesAny('clinic contact', 'contact number', 'address', 'email', 'phone', 'phone number')
  ) {
    return buildClinicContactSummary(clinicProfile);
  }

  if (
    includesAny(
      'patient count',
      'clinic stats',
      'how many patients',
      'patients',
      'users',
      'staff',
      'team',
      'uploads',
      'files'
    )
  ) {
    return buildClinicStatsSummary(clinicProfile);
  }

  if (includesAny('what can you do', 'help', 'who are you')) {
    return buildStaticCapabilitiesSummary(hasPatientContext);
  }

  return null;
};

const AssistantAvatar = ({ size = 42 }: { size?: number }) => (
  <Box
    sx={{
      position: 'relative',
      width: size,
      height: size,
      flex: '0 0 auto',
    }}
  >
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        borderRadius: size * 0.36,
        background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d2ffe0 42%, #79d691 100%)',
        animation: `${floatMotion} 4s ease-in-out infinite, ${glowPulse} 3s ease-in-out infinite`,
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        top: size * 0.28,
        left: size * 0.24,
        width: size * 0.14,
        height: size * 0.14,
        borderRadius: '50%',
        backgroundColor: '#1b4a29',
        animation: `${blinkMotion} 5s ease-in-out infinite`,
        transformOrigin: 'center center',
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        top: size * 0.28,
        right: size * 0.24,
        width: size * 0.14,
        height: size * 0.14,
        borderRadius: '50%',
        backgroundColor: '#1b4a29',
        animation: `${blinkMotion} 5s ease-in-out infinite 150ms`,
        transformOrigin: 'center center',
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        left: '50%',
        bottom: size * 0.22,
        width: size * 0.28,
        height: size * 0.1,
        borderRadius: '0 0 12px 12px',
        border: '2px solid #1f5a31',
        borderTop: 0,
        transform: 'translateX(-50%)',
      }}
    />
  </Box>
);

const SideNavAssistant = (props: SideNavAssistantProps) => {
  const { drawerOpen } = props;
  const user = useAuthStore((state) => state.user);
  const open = useAiAssistantStore((state) => state.isOpen);
  const openAssistant = useAiAssistantStore((state) => state.open);
  const closeAssistant = useAiAssistantStore((state) => state.close);
  const location = useLocation();
  const navigate = useNavigate();
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const hasWelcomedForOpenRef = useRef(false);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [clinicProfile, setClinicProfile] = useState<ClinicProfileModel | null>(null);
  const [voiceError, setVoiceError] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    createAssistantMessage(
      "I'm Ora. Ask me about current subscription, clinic hours, clinic contact details, or clinic stats."
    ),
  ]);

  const patientMatch = matchPath('/patient-profile/:patientId', location.pathname);
  const patientId = patientMatch?.params.patientId;
  const routeContext = patientId
    ? `Patient profile / ${new URLSearchParams(location.search).get('tab') || 'progress-notes'}`
    : 'Clinic workspace';
  const quickQuestions = useMemo(
    () =>
      patientId
        ? ['Current subscription', 'Clinic hours', 'Clinic contact', 'Summarize this patient']
        : ['Current subscription', 'Clinic hours', 'Clinic contact', 'Clinic stats'],
    [patientId]
  );
  const {
    isSupported: isSpeechSupported,
    isEnabled: isSpeechEnabled,
    isSpeaking,
    speak,
    stopSpeaking,
    toggleEnabled: toggleSpeechEnabled,
  } = useSpeechSynthesis({
    enabledByDefault: true,
  });

  useEffect(() => {
    let isMounted = true;

    if (!user?.clinicId) {
      setClinicProfile(null);
      return () => {
        isMounted = false;
      };
    }

    void GetCurrentClinicProfile(user.clinicId)
      .then((profile) => {
        if (isMounted) {
          setClinicProfile(profile);
        }
      })
      .catch(() => {
        if (isMounted) {
          setClinicProfile(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user?.clinicId]);

  useEffect(() => {
    setMessages([
      createAssistantMessage(
        patientId
          ? "I'm Ora, and I'm patient-aware on this screen. I can answer clinic questions locally and try patient-aware AI chat when available."
          : "I'm Ora. Ask me about current subscription, clinic hours, clinic contact details, or clinic stats."
      ),
    ]);
    setDraft('');
    setVoiceError('');
  }, [patientId, routeContext]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [messages, open]);

  useEffect(() => {
    if (!open) {
      stopSpeaking();
    }
  }, [open, stopSpeaking]);

  useEffect(() => {
    if (open && !hasWelcomedForOpenRef.current) {
      hasWelcomedForOpenRef.current = true;
      speak(OPENING_GREETING);
      return;
    }

    if (!open) {
      hasWelcomedForOpenRef.current = false;
    }
  }, [open, speak]);

  const appendAssistantMessage = (content: string, mode: 'static' | 'ai' = 'static'): void => {
    setMessages((previousMessages) => [...previousMessages, createAssistantMessage(content, mode)]);
    speak(content);
  };

  const handleSend = async (content: string): Promise<void> => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isSending) {
      return;
    }

    const userMessage = createUserMessage(trimmedContent);
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft('');

    const staticReply = resolveStaticReply(
      trimmedContent,
      clinicProfile,
      user?.subscriptionType,
      user?.validityDate,
      Boolean(patientId)
    );

    if (staticReply) {
      setMessages([...nextMessages, createAssistantMessage(staticReply, 'static')]);
      speak(staticReply);
      return;
    }

    setIsSending(true);

    try {
      const response = await sendAiAssistantMessage({
        patientId,
        routeContext,
        messages: nextMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      });

      appendAssistantMessage(response.reply, 'ai');
    } catch {
      appendAssistantMessage(
        'OpenAI is unavailable right now, but I can still help with local clinic data. Try asking about current subscription, clinic hours, clinic contact, or clinic stats.',
        'static'
      );
    } finally {
      setIsSending(false);
    }
  };

  const resetConversation = (): void => {
    setMessages([
      createAssistantMessage(
        patientId
          ? "I'm Ora, and I'm patient-aware on this screen. I can answer clinic questions locally and try patient-aware AI chat when available."
          : "I'm Ora. Ask me about current subscription, clinic hours, clinic contact details, or clinic stats."
      ),
    ]);
    setDraft('');
    setVoiceError('');
    stopSpeaking();
  };

  const appendVoiceExchange = (userContent: string, assistantContent: string): void => {
    setMessages((previousMessages) => [
      ...previousMessages,
      createUserMessage(userContent),
      createAssistantMessage(assistantContent, 'static'),
    ]);
    setDraft('');
    speak(assistantContent);
  };

  const handleVoiceTranscript = async (transcript: string): Promise<void> => {
    setVoiceError('');

    try {
      const result = await runVoiceAssistantCommand(transcript, {
        clinicId: user?.clinicId,
        navigate,
      });

      if (result.handled) {
        appendVoiceExchange(
          transcript,
          result.reply || 'The voice command completed successfully.'
        );
        return;
      }

      await handleSend(transcript);
    } catch {
      setVoiceError('I could not complete that voice command right now. Please try again.');
    }
  };

  const {
    isSupported: isVoiceSupported,
    isListening,
    transcriptPreview,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    onTranscript: handleVoiceTranscript,
    onError: (message) => {
      setVoiceError(message);
    },
  });

  const navOffset = drawerOpen ? expandedDrawerOffset : collapsedDrawerOffset;
  const voiceStatusText = !isVoiceSupported
    ? 'Voice commands are available in supported browsers like Chrome or Edge.'
    : voiceError
    ? voiceError
    : isListening
    ? transcriptPreview
      ? `Listening: ${transcriptPreview}`
      : 'Listening... Try "open dashboard", "search Patient Name", or "show income today".'
    : transcriptPreview
    ? `Heard: ${transcriptPreview}`
    : 'Voice commands: "open dashboard", "search Patient Name", or "show income today".';
  const speechToggleTitle = !isSpeechSupported
    ? 'Voice replies are not supported in this browser'
    : isSpeechEnabled
    ? isSpeaking
      ? 'Turn voice replies off and stop speaking'
      : 'Turn voice replies off'
    : 'Turn voice replies on';
  const handleCloseAssistant = (): void => {
    stopSpeaking();
    closeAssistant();
  };

  return (
    <>
      {drawerOpen ? (
        <Tooltip title="Open AI Assistant" placement="right">
          <ListItemButton
            onClick={openAssistant}
            sx={{
              minHeight: 56,
              px: 1.3,
              borderRadius: '16px',
              border: '1px solid rgba(207,255,220,0.16)',
              background: 'linear-gradient(180deg, rgba(207,255,220,0.14), rgba(104,186,127,0.08))',
              color: '#fff',
              boxShadow: '0 10px 18px rgba(8, 29, 48, 0.14)',
              transition: 'transform 140ms ease, box-shadow 140ms ease, background 140ms ease',
              '&:hover': {
                transform: 'translateY(-1px)',
                background:
                  'linear-gradient(180deg, rgba(207,255,220,0.18), rgba(104,186,127,0.12))',
                boxShadow: '0 14px 22px rgba(8, 29, 48, 0.18)',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: 1.25,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <AssistantAvatar size={38} />
            </ListItemIcon>
            <ListItemText
              primary="AI Chat"
              secondary="Open chat on the left"
              primaryTypographyProps={{
                sx: {
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  lineHeight: 1.1,
                  color: '#fff',
                },
              }}
              secondaryTypographyProps={{
                sx: {
                  mt: 0.25,
                  color: 'rgba(231,255,237,0.76)',
                  fontSize: '0.68rem',
                  lineHeight: 1.35,
                },
              }}
            />
            <AutoAwesomeRoundedIcon sx={{ fontSize: 19, color: '#dfffe8', flex: '0 0 auto' }} />
          </ListItemButton>
        </Tooltip>
      ) : (
        <Tooltip title="Open AI Assistant" placement="right">
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton
              onClick={openAssistant}
              aria-label="Open AI assistant"
              sx={{
                width: 46,
                height: 46,
                color: '#173d22',
                background:
                  'radial-gradient(circle at 30% 30%, #ffffff 0%, #d2ffe0 42%, #79d691 100%)',
                boxShadow: '0 14px 26px rgba(9, 40, 20, 0.28)',
                animation: `${floatMotion} 4s ease-in-out infinite`,
                '&:hover': {
                  background:
                    'radial-gradient(circle at 30% 30%, #ffffff 0%, #dfffe7 42%, #8ce2a2 100%)',
                },
              }}
            >
              <SmartToyRoundedIcon />
            </IconButton>
          </Box>
        </Tooltip>
      )}

      <Drawer
        anchor="left"
        open={open}
        onClose={closeAssistant}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            left: { sm: `${navOffset}px` },
            width: {
              xs: '100%',
              sm: 420,
            },
            maxWidth: {
              xs: '100vw',
              sm: `calc(100vw - ${navOffset}px)`,
            },
            background: 'linear-gradient(180deg, rgba(248,251,247,1) 0%, rgba(239,246,240,1) 100%)',
            boxShadow: '0 24px 60px rgba(19, 45, 26, 0.18)',
          },
        }}
      >
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              px: 2.25,
              py: 2,
              color: '#f8fff8',
              background: 'linear-gradient(140deg, rgba(46,111,64,1) 0%, rgba(26,76,39,1) 100%)',
            }}
          >
            <Box
              sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0, pr: 1 }}>
                <AssistantAvatar size={54} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: '1rem', fontWeight: 800 }}>Ora Assistant</Typography>
                  <Typography
                    sx={{
                      mt: 0.5,
                      fontSize: '0.8rem',
                      color: 'rgba(239,255,242,0.84)',
                      lineHeight: 1.45,
                    }}
                  >
                    {patientId
                      ? 'Patient-aware mode is active for this profile.'
                      : 'General clinic mode is active.'}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={0.25}>
                <Tooltip title={speechToggleTitle}>
                  <span>
                    <IconButton
                      onClick={toggleSpeechEnabled}
                      aria-label={
                        isSpeechEnabled ? 'Turn voice replies off' : 'Turn voice replies on'
                      }
                      disabled={!isSpeechSupported}
                      sx={{ color: 'inherit', mt: -0.15 }}
                    >
                      {isSpeechEnabled ? <VolumeUpRoundedIcon /> : <VolumeOffRoundedIcon />}
                    </IconButton>
                  </span>
                </Tooltip>
                <IconButton
                  onClick={handleCloseAssistant}
                  aria-label="Close AI assistant"
                  sx={{ color: 'inherit', mt: -0.15 }}
                >
                  <CloseRoundedIcon />
                </IconButton>
              </Stack>
            </Box>

            <Stack direction="row" spacing={1} sx={{ mt: 1.45, flexWrap: 'wrap', rowGap: 1 }}>
              <Chip
                size="small"
                icon={<BoltRoundedIcon />}
                label={patientId ? 'Patient-aware' : 'Clinic-aware'}
                sx={{
                  color: '#184125',
                  bgcolor: 'rgba(229,248,232,0.96)',
                  '& .MuiChip-label': { fontWeight: 700 },
                  '& .MuiChip-icon': { color: '#2c7040' },
                }}
              />
              <Chip
                size="small"
                label={formatPlanLabel(clinicProfile?.subscriptionType || user?.subscriptionType)}
                sx={{
                  color: '#184125',
                  bgcolor: 'rgba(229,248,232,0.92)',
                  '& .MuiChip-label': { fontWeight: 700 },
                }}
              />
            </Stack>
          </Box>

          <Box
            sx={{
              px: 2.25,
              py: 1.35,
              borderBottom: `1px solid ${alpha('#86a58d', 0.22)}`,
              backgroundColor: 'rgba(255,255,255,0.64)',
            }}
          >
            <Typography sx={{ color: '#416250', fontSize: '0.78rem', lineHeight: 1.5 }}>
              Ask built-in clinic questions or send a custom AI prompt.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1.15, flexWrap: 'wrap', rowGap: 1 }}>
              {quickQuestions.map((question) => (
                <Chip
                  key={question}
                  label={question}
                  onClick={() => void handleSend(question)}
                  disabled={isSending}
                  sx={{
                    maxWidth: '100%',
                    bgcolor: '#eef6ef',
                    color: '#285238',
                    '.MuiChip-label': {
                      whiteSpace: 'normal',
                      fontWeight: 700,
                    },
                  }}
                />
              ))}
            </Stack>
          </Box>

          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              px: 2.25,
              py: 2,
            }}
          >
            <Stack spacing={1.5}>
              {messages.map((message) => {
                const isUserMessage = message.role === 'user';

                return (
                  <Box
                    key={message.id}
                    sx={{
                      alignSelf: isUserMessage ? 'flex-end' : 'flex-start',
                      maxWidth: '88%',
                      px: 1.5,
                      py: 1.2,
                      borderRadius: isUserMessage ? '18px 18px 6px 18px' : '18px 18px 18px 6px',
                      color: isUserMessage ? '#0f2e19' : '#1f3f29',
                      background: isUserMessage
                        ? 'linear-gradient(180deg, #d7f3de 0%, #c5e9cf 100%)'
                        : message.mode === 'ai'
                        ? 'linear-gradient(180deg, #ffffff 0%, #f0f8f1 100%)'
                        : 'linear-gradient(180deg, #ffffff 0%, #f5faf5 100%)',
                      border: '1px solid rgba(135, 169, 142, 0.22)',
                      boxShadow: '0 10px 18px rgba(31, 63, 41, 0.08)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    <Typography sx={{ fontSize: '0.92rem', lineHeight: 1.6 }}>
                      {message.content}
                    </Typography>
                  </Box>
                );
              })}

              {isSending ? (
                <Box
                  sx={{
                    alignSelf: 'flex-start',
                    px: 1.5,
                    py: 1.15,
                    borderRadius: '18px 18px 18px 6px',
                    background: 'linear-gradient(180deg, #ffffff 0%, #f5faf5 100%)',
                    border: '1px solid rgba(135, 169, 142, 0.22)',
                    boxShadow: '0 10px 18px rgba(31, 63, 41, 0.08)',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={16} sx={{ color: '#2e6f40' }} />
                    <Typography sx={{ fontSize: '0.88rem', color: '#416250' }}>
                      Thinking...
                    </Typography>
                  </Stack>
                </Box>
              ) : null}

              <div ref={endOfMessagesRef} />
            </Stack>
          </Box>

          <Divider />

          <Box
            sx={{
              px: 2.25,
              py: 1.7,
              backgroundColor: 'rgba(255,255,255,0.82)',
            }}
          >
            <Typography
              sx={{
                mb: 1,
                fontSize: '0.76rem',
                lineHeight: 1.5,
                color: voiceError ? '#a73546' : isListening ? '#1f5a31' : '#587261',
              }}
            >
              {voiceStatusText}
            </Typography>

            <TextField
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend(draft);
                }
              }}
              placeholder={
                patientId
                  ? 'Ask about this patient, their chart, or clinic info...'
                  : 'Ask about clinic workflows or clinic info...'
              }
              fullWidth
              multiline
              minRows={2}
              maxRows={6}
              disabled={isSending}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '16px',
                  backgroundColor: '#fff',
                },
              }}
            />

            <Stack direction="row" spacing={1.2} sx={{ mt: 1.3 }}>
              <IconButton
                type="button"
                aria-label={isListening ? 'Stop voice command' : 'Start voice command'}
                onClick={isListening ? stopListening : startListening}
                disabled={!isVoiceSupported || isSending}
                sx={{
                  width: 44,
                  height: 44,
                  color: isListening ? '#fff' : '#2e6f40',
                  borderRadius: '12px',
                  border: '1px solid rgba(104, 150, 112, 0.25)',
                  background: isListening
                    ? 'linear-gradient(180deg, #d84a58 0%, #b3303f 100%)'
                    : 'linear-gradient(180deg, #eef7ef 0%, #dceee0 100%)',
                }}
              >
                {isListening ? <StopCircleRoundedIcon /> : <MicRoundedIcon />}
              </IconButton>
              <Button
                type="button"
                variant="outlined"
                startIcon={<RestartAltRoundedIcon />}
                onClick={resetConversation}
                disabled={isSending}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                }}
              >
                New chat
              </Button>
              <Button
                type="button"
                variant="contained"
                endIcon={<SendRoundedIcon />}
                disabled={isSending || !draft.trim()}
                onClick={() => void handleSend(draft)}
                sx={{
                  ml: 'auto',
                  borderRadius: '12px',
                  px: 2.1,
                  textTransform: 'none',
                  background:
                    'linear-gradient(180deg, rgba(46,111,64,1) 0%, rgba(26,76,39,1) 100%)',
                }}
              >
                Send
              </Button>
            </Stack>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default SideNavAssistant;
