/**
 * PreCourseInstructionsModal
 *
 * Shows a one-time "Before You Begin" instructions sheet when a student
 * opens a CourseDetailScreen. Dismissed permanently per user via localStorage.
 *
 * Storage key: `aiwmr_instructions_seen_<userId>`
 * Pass userId="guest" for unauthenticated previews.
 */
import React, { useState, useEffect } from 'react';

interface Props {
  userId: string;
}

const STORAGE_KEY = (id: string) => `aiwmr_instructions_seen_${id}`;

const INSTRUCTIONS: { icon: string; title: string; body: string }[] = [
  {
    icon: '📱',
    title: 'Install a Video Player',
    body:  'Download a compatible video player on your device (VLC or MX Player recommended) before the course begins to ensure smooth playback of all session recordings.',
  },
  {
    icon: '💳',
    title: 'Full Fee Before Commencement',
    body:  '100% of the course fee must be paid and confirmed prior to the course start date. Access to learning materials is granted only after full payment.',
  },
  {
    icon: '📹',
    title: 'Camera On During Live Sessions',
    body:  'All participants must keep their camera switched ON throughout every live session. Attendance will not be recorded for sessions where video is off.',
  },
  {
    icon: '📅',
    title: '100% Attendance Required',
    body:  'Full attendance at all scheduled live sessions is mandatory for course completion and certification eligibility. Please plan your schedule accordingly.',
  },
  {
    icon: '📝',
    title: 'Complete All Module Assessments',
    body:  'Submission of every module assessment is compulsory — no module may be skipped. Incomplete assessments will disqualify you from receiving a certificate.',
  },
  {
    icon: '🎯',
    title: 'Minimum 60% to Pass',
    body:  'A score of 60% or above in each module assessment is required to progress. Students scoring 90% or above qualify for a Free Internship or Academic Project Report.',
  },
  {
    icon: '🔐',
    title: 'Use Your Registered Login Every Time',
    body:  'Always sign in with your registered email and password. Do not create duplicate accounts or share your credentials — attendance and progress are tied to your login.',
  },
  {
    icon: '💻',
    title: 'Access on Mobile & Desktop',
    body:  'This course is fully accessible on both mobile and desktop browsers. Your progress, attendance, and assessments sync automatically across all your devices.',
  },
  {
    icon: '🎓',
    title: 'Certificate Download',
    body:  'Your digital certificate will be available to download from this app once all modules are completed and your assessments have been reviewed and approved by the trainer.',
  },
  {
    icon: '🖨️',
    title: 'Hard Copy of Certificate',
    body:  'For a printed copy of your certificate, contact us at director@aiwmr.org or +91 9676975725, or visit our office in Hyderabad.',
  },
  {
    icon: '🚫',
    title: 'No Recording or Redistribution',
    body:  'Recording of live sessions, screenshots of course materials, or redistribution of any content in any form is strictly prohibited and may result in immediate cancellation of enrollment.',
  },
  {
    icon: '🆘',
    title: 'Technical Support',
    body:  'For any technical difficulties before or during the course, contact us immediately at director@aiwmr.org or +91 9676975725 so we can assist you without disrupting your learning.',
  },
];

const PreCourseInstructionsModal: React.FC<Props> = ({ userId }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const key = STORAGE_KEY(userId);
    if (!localStorage.getItem(key)) {
      // Small delay so the course screen has painted before modal appears
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, [userId]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY(userId), '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    /* Backdrop */
    <div
      onClick={dismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'flex-end',
        animation: 'fadeUp 0.25s ease',
      }}
    >
      {/* Sheet — stop click propagation so tapping the sheet doesn't close it */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxHeight: '88vh',
          background: 'var(--cream)',
          borderRadius: '22px 22px 0 0',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.35s cubic-bezier(0.34,1.2,0.64,1)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--sand)' }}/>
        </div>

        {/* Header */}
        <div style={{
          padding: '12px 22px 16px',
          borderBottom: '1px solid var(--sand)',
          flexShrink: 0,
        }}>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 20, fontWeight: 900,
            color: 'var(--forest)', marginBottom: 4,
          }}>
            📋 Before You Begin
          </div>
          <div style={{ fontSize: 13, color: '#888', fontFamily: "'DM Sans', sans-serif" }}>
            Please read and acknowledge these guidelines before enrolling.
          </div>
        </div>

        {/* Scrollable instructions list */}
        <div style={{ overflowY: 'auto', padding: '12px 16px 8px', flex: 1 }}>
          {INSTRUCTIONS.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                padding: '12px 14px',
                marginBottom: 8,
                background: 'white',
                borderRadius: 14,
                border: '1px solid var(--sand)',
              }}
            >
              {/* Number + icon */}
              <div style={{
                flexShrink: 0,
                width: 36, height: 36,
                borderRadius: 10,
                background: 'var(--mist)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>
                {item.icon}
              </div>

              <div style={{ flex: 1 }}>
                {/* Step number + title */}
                <div style={{
                  fontSize: 13, fontWeight: 700,
                  color: 'var(--forest)',
                  fontFamily: "'DM Sans', sans-serif",
                  marginBottom: 3,
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800,
                    color: 'var(--moss)', marginRight: 6,
                    letterSpacing: '0.5px',
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {item.title}
                </div>
                {/* Body */}
                <div style={{
                  fontSize: 12, color: '#777',
                  lineHeight: 1.5,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {item.body}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div style={{
          padding: '14px 16px 28px',
          flexShrink: 0,
          borderTop: '1px solid var(--sand)',
          background: 'var(--cream)',
        }}>
          <button
            onClick={dismiss}
            style={{
              width: '100%',
              padding: '16px',
              background: 'var(--forest)',
              color: 'white',
              border: 'none',
              borderRadius: 14,
              fontSize: 15, fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer',
              letterSpacing: '0.3px',
            }}
          >
            I Understand & Agree ✓
          </button>
          <div style={{
            textAlign: 'center', marginTop: 10,
            fontSize: 12, color: '#aaa',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            This message will not appear again on this device.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreCourseInstructionsModal;
