import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  Fab,
  IconButton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import StopCircleRoundedIcon from '@mui/icons-material/StopCircleRounded';
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';

import {
  AiAssistantMessage,
  AiAssistantResponse,
  sendAiAssistantMessage,
} from '../../services/ai-assistant-api';
import useSpeechRecognition from '../../hooks/use-speech-recognition';
import useSpeechSynthesis from '../../hooks/use-speech-synthesis';
import { useAiAssistantStore } from '../../store/aiAssistantStore';
import { useAuthStore } from '../../store/authStore';
import { runVoiceAssistantCommand } from '../../utils/voice-commands';
import { useNavigate } from 'react-router-dom';

type UiMessage = AiAssistantMessage & {
  id: string;
};

type AiAssistantProps = {
  patientId?: string;
  routeContext?: string;
  title?: string;
  contextKey: string;
};

const buildAssistantIntro = (hasPatientContext: boolean, title?: string): UiMessage => ({
  id: `assistant-intro-${hasPatientContext ? 'patient' : 'general'}`,
  role: 'assistant',
  content: hasPatientContext
    ? `I'm ready inside ${
        title || 'the patient workspace'
      }. I can summarize this patient's notes, medical history, perio chart, and appointments, or help draft a follow-up message.`
    : `I'm ready inside ${
        title || 'OralSync'
      }. I can help with clinic workflows, patient communication drafts, and general questions about the records you already have on screen.`,
});

const createUserMessage = (content: string): UiMessage => ({
  id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role: 'user',
  content,
});

const createAssistantMessage = (content: string): UiMessage => ({
  id: `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role: 'assistant',
  content,
});

const OPENING_GREETING = "Hey, I'm Ora. What can I do for you?";

const AiAssistant = (props: AiAssistantProps) => {
  const { patientId, routeContext, title, contextKey } = props;
  const theme = useTheme();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const open = useAiAssistantStore((state) => state.isOpen);
  const openAssistant = useAiAssistantStore((state) => state.open);
  const closeAssistant = useAiAssistantStore((state) => state.close);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<UiMessage[]>([
    buildAssistantIntro(Boolean(patientId), title),
  ]);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [voiceErrorMessage, setVoiceErrorMessage] = useState('');
  const [lastResponse, setLastResponse] = useState<AiAssistantResponse | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const hasWelcomedForOpenRef = useRef(false);
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

  const suggestions = useMemo(
    () =>
      patientId
        ? [
            "Summarize this patient's latest progress notes.",
            'What stands out in the latest perio chart?',
            'Draft a short follow-up message for this patient.',
          ]
        : [
            'What can you help me with in OralSync?',
            'Draft a polite appointment reminder.',
            'Give me a checklist for documenting a patient follow-up.',
          ],
    [patientId]
  );

  useEffect(() => {
    setMessages([buildAssistantIntro(Boolean(patientId), title)]);
    setDraft('');
    setErrorMessage('');
    setVoiceErrorMessage('');
    setIsSending(false);
    setLastResponse(null);
  }, [contextKey, patientId, title]);

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

  const appendAssistantMessage = (content: string): void => {
    setMessages((previousMessages) => [...previousMessages, createAssistantMessage(content)]);
    speak(content);
  };

  const sendMessage = async (content: string): Promise<void> => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isSending) {
      return;
    }

    const nextUserMessage = createUserMessage(trimmedContent);
    const nextMessages = [...messages, nextUserMessage];

    setMessages(nextMessages);
    setDraft('');
    setIsSending(true);
    setErrorMessage('');

    try {
      const response = await sendAiAssistantMessage({
        patientId,
        routeContext,
        messages: nextMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      });

      setLastResponse(response);
      appendAssistantMessage(response.reply);
    } catch (error: any) {
      setErrorMessage(
        typeof error?.response?.data === 'string'
          ? error.response.data
          : 'Unable to reach the AI assistant right now.'
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>): Promise<void> => {
    event?.preventDefault();
    await sendMessage(draft);
  };

  const handleKeyDown = async (
    event: KeyboardEvent<HTMLDivElement | HTMLTextAreaElement>
  ): Promise<void> => {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }

    event.preventDefault();
    await sendMessage(draft);
  };

  const resetConversation = (): void => {
    setMessages([buildAssistantIntro(Boolean(patientId), title)]);
    setDraft('');
    setErrorMessage('');
    setVoiceErrorMessage('');
    setLastResponse(null);
    stopSpeaking();
  };

  const appendVoiceExchange = (userContent: string, assistantContent: string): void => {
    setMessages((previousMessages) => [
      ...previousMessages,
      createUserMessage(userContent),
      createAssistantMessage(assistantContent),
    ]);
    setDraft('');
    speak(assistantContent);
  };

  const handleVoiceTranscript = async (transcript: string): Promise<void> => {
    setVoiceErrorMessage('');

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

      await sendMessage(transcript);
    } catch {
      setVoiceErrorMessage('I could not complete that voice command right now. Please try again.');
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
      setVoiceErrorMessage(message);
    },
  });

  const voiceStatusText = !isVoiceSupported
    ? 'Voice commands are available in supported browsers like Chrome or Edge.'
    : voiceErrorMessage
    ? voiceErrorMessage
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
      <Fab
        color="primary"
        aria-label="Open AI assistant"
        onClick={openAssistant}
        sx={{
          position: 'fixed',
          right: { xs: 14, sm: 24 },
          bottom: { xs: 74, sm: 24 },
          zIndex: theme.zIndex.drawer + 3,
          width: 62,
          height: 62,
          background: 'linear-gradient(180deg, rgba(46,111,64,1) 0%, rgba(26,76,39,1) 100%)',
          boxShadow: '0 18px 32px rgba(16, 50, 25, 0.28)',
          '&:hover': {
            background: 'linear-gradient(180deg, rgba(55,128,75,1) 0%, rgba(26,76,39,1) 100%)',
          },
        }}
      >
        <AutoAwesomeRoundedIcon sx={{ fontSize: 28 }} />
      </Fab>

      <Drawer
        anchor="right"
        open={open}
        onClose={closeAssistant}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 420 },
            maxWidth: '100vw',
            background: 'linear-gradient(180deg, rgba(248,251,247,1) 0%, rgba(239,246,240,1) 100%)',
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
              <Box sx={{ minWidth: 0, pr: 1 }}>
                <Typography sx={{ fontSize: '1rem', fontWeight: 800 }}>
                  {title || 'OralSync AI Assistant'}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.6,
                    fontSize: '0.8rem',
                    color: 'rgba(239,255,242,0.84)',
                    lineHeight: 1.45,
                  }}
                >
                  {patientId
                    ? 'Patient-aware mode is active for this profile.'
                    : 'General clinic mode is active. Open a patient profile for chart-aware answers.'}
                </Typography>
              </Box>

              <Stack direction="row" spacing={0.25}>
                <IconButton
                  onClick={toggleSpeechEnabled}
                  aria-label={isSpeechEnabled ? 'Turn voice replies off' : 'Turn voice replies on'}
                  disabled={!isSpeechSupported}
                  title={speechToggleTitle}
                  sx={{ color: 'inherit', mt: -0.25 }}
                >
                  {isSpeechEnabled ? <VolumeUpRoundedIcon /> : <VolumeOffRoundedIcon />}
                </IconButton>
                <IconButton
                  onClick={handleCloseAssistant}
                  aria-label="Close AI assistant"
                  sx={{ color: 'inherit', mt: -0.25 }}
                >
                  <CloseRoundedIcon />
                </IconButton>
              </Stack>
            </Box>

            <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
              <Chip
                size="small"
                icon={<SmartToyRoundedIcon />}
                label={
                  lastResponse?.contextLabel || (patientId ? 'Patient context' : 'Clinic context')
                }
                sx={{
                  color: '#184125',
                  bgcolor: 'rgba(229,248,232,0.96)',
                  '& .MuiChip-icon': { color: '#2c7040' },
                }}
              />
              {lastResponse?.model ? (
                <Chip
                  size="small"
                  label={lastResponse.model}
                  sx={{
                    color: '#184125',
                    bgcolor: 'rgba(229,248,232,0.92)',
                  }}
                />
              ) : null}
            </Stack>
          </Box>

          <Box
            sx={{
              px: 2.25,
              py: 1.4,
              borderBottom: '1px solid rgba(133, 167, 142, 0.18)',
              backgroundColor: 'rgba(255,255,255,0.65)',
            }}
          >
            <Typography sx={{ color: '#416250', fontSize: '0.78rem', lineHeight: 1.5 }}>
              AI can be wrong. Review clinical content before acting on it.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1.2, flexWrap: 'wrap', rowGap: 1 }}>
              {suggestions.map((suggestion) => (
                <Chip
                  key={suggestion}
                  label={suggestion}
                  onClick={() => void sendMessage(suggestion)}
                  disabled={isSending}
                  sx={{
                    maxWidth: '100%',
                    bgcolor: '#eef6ef',
                    color: '#285238',
                    '.MuiChip-label': {
                      whiteSpace: 'normal',
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

              {errorMessage ? (
                <Box
                  sx={{
                    alignSelf: 'stretch',
                    px: 1.4,
                    py: 1.1,
                    borderRadius: 2,
                    color: '#7a2030',
                    backgroundColor: '#fff1f2',
                    border: '1px solid rgba(216, 88, 112, 0.26)',
                  }}
                >
                  <Typography sx={{ fontSize: '0.88rem', lineHeight: 1.55 }}>
                    {errorMessage}
                  </Typography>
                </Box>
              ) : null}

              <div ref={endOfMessagesRef} />
            </Stack>
          </Box>

          <Divider />

          <Box
            component="form"
            onSubmit={(event) => void handleSubmit(event)}
            sx={{
              px: 2.25,
              py: 1.75,
              backgroundColor: 'rgba(255,255,255,0.82)',
            }}
          >
            <Typography
              sx={{
                mb: 1,
                fontSize: '0.76rem',
                lineHeight: 1.5,
                color: voiceErrorMessage ? '#a73546' : isListening ? '#1f5a31' : '#587261',
              }}
            >
              {voiceStatusText}
            </Typography>

            <TextField
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => void handleKeyDown(event)}
              placeholder={
                patientId
                  ? 'Ask about this patient, their chart, or draft a message...'
                  : 'Ask about clinic workflows, notes, or patient communication...'
              }
              fullWidth
              multiline
              minRows={isMobile ? 3 : 2}
              maxRows={6}
              disabled={isSending}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '16px',
                  backgroundColor: '#fff',
                },
              }}
            />

            <Stack direction="row" spacing={1.25} sx={{ mt: 1.35 }}>
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
                type="submit"
                variant="contained"
                endIcon={<SendRoundedIcon />}
                disabled={isSending || !draft.trim()}
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

export default AiAssistant;
