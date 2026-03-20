import { FunctionComponent, JSX } from 'react';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import { Box, Typography } from '@mui/material';
import styles from '../style.scss.module.scss';

const PatientProgressNoteDataConverter: FunctionComponent = (): JSX.Element => {
  return (
    <div className={styles.converterSurface}>
      <section className={styles.converterHeroCard}>
        <div>
          <h4 className={styles.converterHeroTitle}>Patient Progress Note Converter</h4>
          <p className={styles.converterHeroText}>
            This tab is reserved for converting external progress note files into a normalized
            format for your system.
          </p>
        </div>
      </section>

      <section className={styles.converterFieldPanel}>
        <Box className={styles.formPanelHeader}>
          <div className={styles.formPanelIcon} aria-hidden="true">
            <DescriptionRoundedIcon />
          </div>
          <div>
            <h3 className={styles.formPanelTitle}>Patient Progress Note</h3>
            <p className={styles.formPanelDescription}>
              The progress note converter has its own tab now. The converter logic can be added
              here next, separate from the patient information converter.
            </p>
          </div>
        </Box>

        <Box className={styles.emptyMiniState}>
          <Typography className={styles.emptyMiniTitle}>Progress Note Converter Coming Next</Typography>
          <Typography className={styles.emptyMiniText}>
            Use the `PatientInfo` tab for CSV/XLSX mapping right now. This tab is ready for a
            dedicated progress note converter component.
          </Typography>
        </Box>
      </section>
    </div>
  );
};

export default PatientProgressNoteDataConverter;
