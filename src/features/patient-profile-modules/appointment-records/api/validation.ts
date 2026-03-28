import * as yup from 'yup';

export const patientAppointmentRecordValidationSchema = yup.object({
  appointmentDateFrom: yup.string().trim().required('Appointment start date is required.'),
  appointmentDateTo: yup
    .string()
    .trim()
    .required('Appointment end time is required.')
    .test(
      'appointment-time-range',
      'Appointment end time is invalid. It must be later than the start time.',
      function (value?: string) {
        const { appointmentDateFrom } = this.parent as { appointmentDateFrom?: string };

        if (!appointmentDateFrom || !value) {
          return true;
        }

        const startDate = new Date(appointmentDateFrom);

        if (Number.isNaN(startDate.getTime())) {
          return true;
        }

        const [hours, minutes] = value.split(':').map(Number);

        if (Number.isNaN(hours) || Number.isNaN(minutes)) {
          return true;
        }

        const endDate = new Date(startDate);
        endDate.setHours(hours, minutes, 0, 0);

        return endDate.getTime() > startDate.getTime();
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
