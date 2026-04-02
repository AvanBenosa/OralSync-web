import * as yup from 'yup';

export const patientAppointmentRecordValidationSchema = yup.object({
  appointmentDate: yup.string().trim().required('Appointment date is required.'),
  appointmentStartTime: yup.string().trim().required('Appointment start time is required.'),
  appointmentEndTime: yup
    .string()
    .trim()
    .required('Appointment end time is required.')
    .test(
      'appointment-time-range',
      'Appointment end time is invalid. It must be later than the start time.',
      function (value?: string) {
        const { appointmentStartTime } = this.parent as { appointmentStartTime?: string };

        if (!appointmentStartTime || !value) {
          return true;
        }

        const [startHours, startMinutes] = appointmentStartTime.split(':').map(Number);
        const [endHours, endMinutes] = value.split(':').map(Number);

        if (
          Number.isNaN(startHours) ||
          Number.isNaN(startMinutes) ||
          Number.isNaN(endHours) ||
          Number.isNaN(endMinutes)
        ) {
          return true;
        }

        const startTotalMinutes = startHours * 60 + startMinutes;
        const endTotalMinutes = endHours * 60 + endMinutes;

        return endTotalMinutes > startTotalMinutes;
      }
    ),
  reasonForVisit: yup
    .string()
    .trim()
    .required('Reason for visit is required.')
    .max(255, 'Reason for visit must not exceed 255 characters.'),
  status: yup.string().trim().required('Status is required.'),
  appointmentType: yup.string().trim().required('Appointment type is required.'),
  remarks: yup.string().trim().max(500, 'Remarks must not exceed 500 characters.'),
});
