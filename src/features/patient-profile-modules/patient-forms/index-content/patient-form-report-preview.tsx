import { FunctionComponent, JSX, RefObject, useEffect, useMemo, useRef, useState } from 'react';

import { GetCurrentClinicProfile } from '../../../settings/clinic-profile/api/api';
import { ClinicProfileModel } from '../../../settings/clinic-profile/api/types';
import {
  isProtectedStoragePath,
  loadProtectedAssetObjectUrl,
  resolveApiAssetUrl,
} from '../../../../common/services/api-client';
import { PatientProfileModel } from '../../../patient-profile/api/types';
import {
  buildPatientFormPatientName,
  formatPatientFormDisplayDate,
  resolvePatientFormTemplateContent,
} from '../api/template-content';
import { PatientFormModel } from '../api/types';
import { useAuthStore } from '../../../../common/store/authStore';

type PatientFormReportPreviewProps = {
  item: PatientFormModel;
  patientProfile?: PatientProfileModel | null;
  reportRef?: RefObject<HTMLDivElement | null>;
};

const calculateAge = (age?: number, birthDate?: string | Date): string => {
  if (typeof age === 'number' && !Number.isNaN(age)) {
    return String(age);
  }

  if (!birthDate) {
    return '--';
  }

  const date = birthDate instanceof Date ? birthDate : new Date(birthDate);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  const today = new Date();
  let nextAge = today.getFullYear() - date.getFullYear();
  const monthDifference = today.getMonth() - date.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < date.getDate())) {
    nextAge -= 1;
  }

  return nextAge >= 0 ? String(nextAge) : '--';
};

export const PatientFormReportPreview: FunctionComponent<PatientFormReportPreviewProps> = (
  props: PatientFormReportPreviewProps
): JSX.Element => {
  const { item, patientProfile, reportRef } = props;
  const localReportRef = useRef<HTMLDivElement | null>(null);
  const resolvedReportRef = reportRef || localReportRef;
  const [clinicProfile, setClinicProfile] = useState<ClinicProfileModel | null>(null);
  const [bannerSrc, setBannerSrc] = useState<string>('');
  const authClinicName = useAuthStore((store) => store.user?.clinicName?.trim() || '');
  const authBannerImagePath = useAuthStore((store) => store.user?.bannerImagePath?.trim() || '');

  useEffect(() => {
    let isMounted = true;

    void GetCurrentClinicProfile()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setClinicProfile(response);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setClinicProfile(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const resolvedClinicProfile = useMemo<ClinicProfileModel | null>(() => {
    if (!clinicProfile && !authClinicName && !authBannerImagePath) {
      return null;
    }

    return {
      ...(clinicProfile || {}),
      clinicName: clinicProfile?.clinicName?.trim() || authClinicName,
      bannerImagePath: clinicProfile?.bannerImagePath?.trim() || authBannerImagePath,
    };
  }, [authBannerImagePath, authClinicName, clinicProfile]);

  useEffect(() => {
    let isActive = true;
    const bannerPath = resolvedClinicProfile?.bannerImagePath?.trim() || '';

    if (!bannerPath) {
      setBannerSrc((previousValue) => {
        if (previousValue?.startsWith('blob:')) {
          URL.revokeObjectURL(previousValue);
        }

        return '';
      });
      return;
    }

    if (!isProtectedStoragePath(bannerPath)) {
      setBannerSrc((previousValue) => {
        if (previousValue?.startsWith('blob:')) {
          URL.revokeObjectURL(previousValue);
        }

        return resolveApiAssetUrl(bannerPath);
      });
      return;
    }

    void loadProtectedAssetObjectUrl(bannerPath)
      .then((objectUrl) => {
        if (!isActive) {
          URL.revokeObjectURL(objectUrl);
          return;
        }

        setBannerSrc((previousValue) => {
          if (previousValue?.startsWith('blob:')) {
            URL.revokeObjectURL(previousValue);
          }

          return objectUrl;
        });
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setBannerSrc((previousValue) => {
          if (previousValue?.startsWith('blob:')) {
            URL.revokeObjectURL(previousValue);
          }

          return '';
        });
      });

    return () => {
      isActive = false;
    };
  }, [resolvedClinicProfile]);

  useEffect(() => {
    return () => {
      if (bannerSrc?.startsWith('blob:')) {
        URL.revokeObjectURL(bannerSrc);
      }
    };
  }, [bannerSrc]);

  const patientName = useMemo(() => buildPatientFormPatientName(patientProfile), [patientProfile]);

  const patientAddress = patientProfile?.address?.trim() || '--';
  const reportDate = formatPatientFormDisplayDate(item.date);
  const reportHtml = useMemo(() => {
    const rawHtml = item.reportTemplate?.trim() || '<p>No report template available.</p>';

    return resolvePatientFormTemplateContent(rawHtml, {
      patientProfile,
      clinicProfile: resolvedClinicProfile,
      assignedDoctor: item.assignedDoctor,
      date: item.date,
    });
  }, [item.assignedDoctor, item.date, item.reportTemplate, patientProfile, resolvedClinicProfile]);
  const assignedDoctor = item.assignedDoctor?.trim() || '--';
  const clinicContactInfo = [
    resolvedClinicProfile?.contactNumber?.trim(),
    resolvedClinicProfile?.emailAddress?.trim(),
  ]
    .filter(Boolean)
    .join(' | ');

  return (
    <div
      ref={resolvedReportRef}
      style={{
        width: '100%',
        background: '#ffffff',
        border: '1px solid rgba(210, 219, 228, 0.95)',
        borderRadius: 20,
        padding: 24,
        boxSizing: 'border-box',
        color: '#22364d',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              minHeight: 110,
              padding: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#ffffff',
            }}
          >
            {bannerSrc ? (
              <img
                src={bannerSrc}
                alt={resolvedClinicProfile?.clinicName || 'Clinic banner'}
                style={{ width: '100%', maxHeight: 170, objectFit: 'contain' }}
              />
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  color: '#ae8a3c',
                  fontSize: 42,
                  fontWeight: 300,
                  letterSpacing: '0.04em',
                }}
              >
                {resolvedClinicProfile?.clinicName || 'Clinic Banner'}
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              textAlign: 'center',
              color: '#324a62',
            }}
          >
            {resolvedClinicProfile?.address ? (
              <div style={{ fontSize: 14, fontWeight: 600 }}>{resolvedClinicProfile.address}</div>
            ) : null}
            {clinicContactInfo ? <div style={{ fontSize: 14 }}>{clinicContactInfo}</div> : null}
          </div>
        </div>

        <div style={{ height: 2, background: '#22364d', opacity: 0.85 }} />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontWeight: 700 }}>Name:</span>
            <span>{patientName}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontWeight: 700 }}>Age:</span>
            <span>{calculateAge(patientProfile?.age, patientProfile?.birthDate)}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontWeight: 700 }}>Address:</span>
            <span>{patientAddress}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontWeight: 700 }}>Date:</span>
            <span>{reportDate}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontWeight: 700 }}>Assigned Dentist:</span>
            <span>{assignedDoctor}</span>
          </div>
        </div>

        <div
          style={{
            border: '1px solid rgba(226, 233, 240, 0.95)',
            borderRadius: 18,
            padding: 20,
            background: '#ffffff',
            boxShadow: '0 12px 28px rgba(28, 56, 86, 0.06)',
          }}
        >
          <div
            style={{
              color: '#22364d',
              fontSize: 14,
              lineHeight: 1.7,
            }}
            dangerouslySetInnerHTML={{
              __html: reportHtml,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PatientFormReportPreview;
