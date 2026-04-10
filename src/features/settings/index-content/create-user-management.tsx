import {
  Alert,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import { isAxiosError } from 'axios';
import { FunctionComponent, JSX, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../../common/store/authStore';
import { isClinicWideRole } from '../../../common/utils/branch-access';
import {
  getSubscriptionUserLimit,
  normalizeSubscriptionType,
} from '../../../common/utils/subscription';
import {
  REGISTER_EMPLOYMENT_OPTIONS,
  REGISTER_PREFIX_OPTIONS,
  REGISTER_ROLE_OPTIONS,
  REGISTER_SUFFIX_OPTIONS,
  RegisterEmploymentType,
  RegisterPrefix,
  RegisterSuffix,
  RegisterUserRole,
} from '../../register/api/types';
import { GetClinicBranches } from '../clinic-branch/api/api';
import type { ClinicBranchModel } from '../clinic-branch/api/types';
import {
  HandleCreateClinicUser,
  HandleDeleteClinicUser,
  HandleUpdateClinicUser,
} from '../create-user/api/handlers';
import {
  CreateUserFormValues,
  CreateUserStateProps,
  SettingsUserModel,
} from '../create-user/api/types';
import styles from '../style.scss.module.scss';

const createInitialValues = (
  role: RegisterUserRole = RegisterUserRole.User
): CreateUserFormValues => ({
  id: undefined,
  userName: '',
  firstName: '',
  lastName: '',
  middleName: '',
  emailAddress: '',
  birthDate: '',
  contactNumber: '',
  address: '',
  suffix: RegisterSuffix.None,
  preffix: RegisterPrefix.None,
  religion: '',
  startDate: '',
  employmentType: RegisterEmploymentType.None,
  bio: '',
  role,
  defaultBranchId: '',
  password: '',
  confirmPassword: '',
  isActive: true,
});

const formatDateInput = (value?: string): string => {
  if (!value) {
    return '';
  }

  return value.includes('T') ? value.slice(0, 10) : value;
};

const toFormValues = (item: SettingsUserModel): CreateUserFormValues => ({
  id: item.id,
  userName: item.userName || '',
  firstName: item.firstName || '',
  lastName: item.lastName || '',
  middleName: item.middleName || '',
  emailAddress: item.emailAddress || '',
  birthDate: formatDateInput(item.birthDate),
  contactNumber: item.contactNumber || '',
  address: item.address || '',
  suffix: item.suffix ?? RegisterSuffix.None,
  preffix: item.preffix ?? RegisterPrefix.None,
  religion: item.religion || '',
  startDate: formatDateInput(item.startDate),
  employmentType: item.employmentType ?? RegisterEmploymentType.None,
  bio: item.bio || '',
  role: item.role ?? RegisterUserRole.User,
  defaultBranchId: item.defaultBranchId || '',
  password: '',
  confirmPassword: '',
  isActive: item.isActive ?? true,
});

const isSuperAdminUser = (item: SettingsUserModel): boolean =>
  item.role === RegisterUserRole.SuperAdmin ||
  (item.roleLabel || '').toLowerCase() === 'superadmin';

const isBranchAdmin = (item: SettingsUserModel): boolean =>
  item.role === RegisterUserRole.BranchAdmin ||
  (item.roleLabel || '').toLowerCase() === 'branchadmin';

const isSuperAdminRole = (value?: string | null): boolean =>
  (value || '').trim().toLowerCase() === 'superadmin';

const requiresBranchAssignment = (role?: RegisterUserRole): boolean =>
  role === RegisterUserRole.BranchAdmin ||
  role === RegisterUserRole.Dentist ||
  role === RegisterUserRole.Assistant ||
  role === RegisterUserRole.Receptionist;

const formatSubscriptionLabel = (value?: string | null): string => {
  const normalizedValue = normalizeSubscriptionType(value);

  if (normalizedValue === 'basic') {
    return 'Basic';
  }

  if (normalizedValue === 'standard') {
    return 'Standard';
  }

  if (normalizedValue === 'premium') {
    return 'Premium';
  }

  return 'Current';
};

const CreateUserManagement: FunctionComponent<CreateUserStateProps> = (
  props: CreateUserStateProps
): JSX.Element => {
  const { state, setState } = props;
  const subscriptionType = useAuthStore((store) => store.user?.subscriptionType ?? '');
  const clinicId = useAuthStore((store) => store.user?.clinicId ?? null);
  const currentUserRole = useAuthStore((store) => store.user?.role ?? '');
  const canAssignClinicWideRoles = isClinicWideRole(currentUserRole);
  const canManageBranchAdminAccounts = isSuperAdminRole(currentUserRole);
  const defaultManagedRole = canAssignClinicWideRoles
    ? RegisterUserRole.User
    : RegisterUserRole.Dentist;
  const [formValues, setFormValues] = useState<CreateUserFormValues>(() =>
    createInitialValues(defaultManagedRole)
  );
  const [branches, setBranches] = useState<ClinicBranchModel[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const userLimit = getSubscriptionUserLimit(subscriptionType);
  const currentUserCount = Math.max(state.totalItem || 0, 0);
  const isCreateLimitReached =
    !state.isUpdate && userLimit !== null && currentUserCount >= userLimit;
  const subscriptionLabel = formatSubscriptionLabel(subscriptionType);
  const createLimitMessage =
    userLimit !== null
      ? `${subscriptionLabel} subscription allows up to ${userLimit} users only. Upgrade the plan to add more clinic accounts.`
      : '';
  const branchAssignmentRequired = requiresBranchAssignment(formValues.role);
  const selectedItemIsBranchAdmin = Boolean(state.item && isBranchAdmin(state.item));
  const isBranchAdminEditLocked =
    state.isUpdate && selectedItemIsBranchAdmin && !canManageBranchAdminAccounts;
  const branchAdminAssignmentsByBranchId = useMemo(() => {
    const assignments = new Map<string, SettingsUserModel>();

    state.items.forEach((item) => {
      if (!isBranchAdmin(item) || !item.defaultBranchId?.trim()) {
        return;
      }

      assignments.set(item.defaultBranchId.trim(), item);
    });

    return assignments;
  }, [state.items]);
  const conflictingBranchAdmin = useMemo(() => {
    const branchId = formValues.defaultBranchId.trim();
    if (!branchId) {
      return null;
    }

    const branchAdmin = branchAdminAssignmentsByBranchId.get(branchId);
    if (!branchAdmin) {
      return null;
    }

    return branchAdmin.id && formValues.id && branchAdmin.id === formValues.id ? null : branchAdmin;
  }, [branchAdminAssignmentsByBranchId, formValues.defaultBranchId, formValues.id]);
  const branchAdminConflictMessage = conflictingBranchAdmin
    ? `${
        [conflictingBranchAdmin.firstName, conflictingBranchAdmin.lastName]
          .filter(Boolean)
          .join(' ') ||
        conflictingBranchAdmin.userName ||
        'Another user'
      } is already assigned as Branch Admin for the selected branch.`
    : '';
  const availableRoleOptions = useMemo(() => {
    const baseOptions = canAssignClinicWideRoles
      ? REGISTER_ROLE_OPTIONS
      : REGISTER_ROLE_OPTIONS.filter((option) =>
          [
            RegisterUserRole.Dentist,
            RegisterUserRole.Assistant,
            RegisterUserRole.Receptionist,
          ].includes(option.value)
        );

    if (!canManageBranchAdminAccounts) {
      const nonBranchAdminOptions = baseOptions.filter(
        (option) => option.value !== RegisterUserRole.BranchAdmin
      );

      if (isBranchAdminEditLocked) {
        return [
          ...nonBranchAdminOptions,
          {
            value: RegisterUserRole.BranchAdmin,
            label: 'Branch Admin',
          },
        ];
      }

      return nonBranchAdminOptions;
    }

    if (conflictingBranchAdmin && formValues.role !== RegisterUserRole.BranchAdmin) {
      return baseOptions.filter((option) => option.value !== RegisterUserRole.BranchAdmin);
    }

    return baseOptions;
  }, [
    canAssignClinicWideRoles,
    canManageBranchAdminAccounts,
    conflictingBranchAdmin,
    formValues.role,
    isBranchAdminEditLocked,
  ]);

  useEffect(() => {
    if (!clinicId?.trim()) {
      setBranches([]);
      return;
    }

    void GetClinicBranches(clinicId)
      .then((response) => {
        setBranches(response.items || []);
      })
      .catch(() => {
        setBranches([]);
      });
  }, [clinicId]);

  useEffect(() => {
    if (state.isUpdate) {
      return;
    }

    setFormValues((current) =>
      availableRoleOptions.some((option) => option.value === current.role)
        ? current
        : createInitialValues(defaultManagedRole)
    );
  }, [availableRoleOptions, defaultManagedRole, state.isUpdate]);

  useEffect(() => {
    if (branchAssignmentRequired) {
      return;
    }

    setFormValues((current) =>
      current.defaultBranchId
        ? {
            ...current,
            defaultBranchId: '',
          }
        : current
    );
  }, [branchAssignmentRequired]);

  const filteredUsers = useMemo(() => {
    const query = state.search.trim().toLowerCase();

    if (!query) {
      return state.items;
    }

    return state.items.filter((item) =>
      [item.userName, item.firstName, item.lastName, item.emailAddress, item.roleLabel]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [state.items, state.search]);

  const resetForm = (): void => {
    setFormValues(createInitialValues(defaultManagedRole));
    setState((prev: any) => ({
      ...prev,
      item: null,
      isUpdate: false,
      isDelete: false,
    }));
  };

  const handleTextChange = (
    field: keyof CreateUserFormValues,
    value: string | number | boolean
  ) => {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
    setStatusMessage('');
    setSubmitError('');
  };

  const handleEdit = (item: SettingsUserModel): void => {
    if (state.isUpdate && state.item?.id === item.id) {
      resetForm();
      return;
    }

    setFormValues(toFormValues(item));
    setState((prev: any) => ({
      ...prev,
      item,
      isUpdate: true,
      isDelete: false,
    }));
    setStatusMessage('');
    setSubmitError('');
  };

  const handleDelete = async (item: SettingsUserModel): Promise<void> => {
    if (!item.id || isSuperAdminUser(item) || isBranchAdmin(item)) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${[item.firstName, item.lastName].filter(Boolean).join(' ') || item.userName}?`
    );

    if (!confirmed) {
      return;
    }

    setStatusMessage('');
    setSubmitError('');

    try {
      await HandleDeleteClinicUser(item.id, state, setState);

      if (state.item?.id === item.id) {
        resetForm();
      }

      setStatusMessage('User account has been deleted successfully.');
    } catch (error) {
      if (isAxiosError(error)) {
        setSubmitError(
          typeof error.response?.data === 'string' ? error.response.data : error.message
        );
      } else {
        setSubmitError('Unable to delete user account.');
      }
    }
  };

  const handleSubmit = async (): Promise<void> => {
    setStatusMessage('');
    setSubmitError('');

    if (isBranchAdminEditLocked) {
      setSubmitError('Only super admin can update Branch Admin accounts.');
      return;
    }

    if (isCreateLimitReached) {
      setSubmitError(createLimitMessage);
      return;
    }

    if (
      !formValues.userName.trim() ||
      !formValues.firstName.trim() ||
      !formValues.lastName.trim()
    ) {
      setSubmitError('Username, first name, and last name are required.');
      return;
    }

    if (!formValues.emailAddress.trim()) {
      setSubmitError('Email address is required.');
      return;
    }

    // if (branchAssignmentRequired && !formValues.defaultBranchId.trim()) {
    //   setSubmitError('Default branch is required for branch-scoped users.');
    //   return;
    // }

    if (formValues.role === RegisterUserRole.BranchAdmin && !canManageBranchAdminAccounts) {
      setSubmitError('Only super admin can assign the Branch Admin role.');
      return;
    }

    if (formValues.role === RegisterUserRole.BranchAdmin && conflictingBranchAdmin) {
      setSubmitError('The selected branch already has a Branch Admin assigned.');
      return;
    }

    if (!state.isUpdate && (!formValues.password || !formValues.confirmPassword)) {
      setSubmitError('Password and confirm password are required.');
      return;
    }

    if (
      (formValues.password || formValues.confirmPassword) &&
      formValues.password !== formValues.confirmPassword
    ) {
      setSubmitError('Password and confirm password must match.');
      return;
    }

    try {
      if (state.isUpdate && formValues.id) {
        await HandleUpdateClinicUser(formValues, state, setState);
        setStatusMessage('User account has been updated successfully.');
      } else {
        await HandleCreateClinicUser(formValues, state, setState);
        setStatusMessage('User account has been created successfully.');
      }

      resetForm();
      setStatusMessage(
        state.isUpdate
          ? 'User account has been updated successfully.'
          : 'User account has been created successfully.'
      );
    } catch (error) {
      if (isAxiosError(error)) {
        setSubmitError(
          typeof error.response?.data === 'string' ? error.response.data : error.message
        );
      } else {
        setSubmitError(
          state.isUpdate ? 'Unable to update user account.' : 'Unable to create user account.'
        );
      }
    }
  };

  return (
    <div className={styles.dualPanelGrid}>
      <section className={styles.formPanel}>
        <div className={styles.formPanelHeader}>
          <div className={styles.formPanelIcon} aria-hidden="true">
            <GroupRoundedIcon />
          </div>
          <div>
            <h3 className={styles.formPanelTitle}>List Of Users</h3>
            <p className={styles.formPanelDescription}>
              View the current clinic accounts before creating another user.
            </p>
          </div>
        </div>

        <TextField
          label="Search Users"
          value={state.search}
          onChange={(event) =>
            setState((prev: any) => ({
              ...prev,
              search: event.target.value,
            }))
          }
          fullWidth
          size="small"
          sx={{ mb: 2 }}
        />

        <div className={styles.userListSurface}>
          {filteredUsers.length ? (
            filteredUsers.map((item) => (
              <div
                key={item.id || item.userName}
                className={`${styles.userListCard} ${
                  state.isUpdate && state.item?.id === item.id ? styles.userListCardActive : ''
                }`}
              >
                <div className={styles.userListRow}>
                  <div className={styles.userListIdentity}>
                    <div className={styles.userListAvatar} aria-hidden="true">
                      {isSuperAdminUser(item) ? (
                        <AdminPanelSettingsRoundedIcon />
                      ) : (
                        <BadgeRoundedIcon />
                      )}
                    </div>
                    <div className={styles.userListContent}>
                      <Typography className={styles.userListName}>
                        {[item.firstName, item.lastName].filter(Boolean).join(' ') || item.userName}
                      </Typography>
                      <Typography className={styles.userListMeta}>
                        {(item.userName || '--') + ' • ' + (item.roleLabel || 'user')}
                      </Typography>
                      <Typography className={styles.userListEmail}>
                        {item.emailAddress || '--'}
                      </Typography>
                      <Typography className={styles.userListEmail}>
                        {item.defaultBranchName?.trim() || 'All branches'}
                      </Typography>
                    </div>
                  </div>
                  <div className={styles.userListActions}>
                    <IconButton
                      size="small"
                      className={`${styles.userListActionButton} ${
                        state.isUpdate && state.item?.id === item.id
                          ? styles.userListCancelButton
                          : ''
                      }`}
                      onClick={() => handleEdit(item)}
                    >
                      {state.isUpdate && state.item?.id === item.id ? (
                        <CloseRoundedIcon fontSize="small" />
                      ) : (
                        <EditRoundedIcon fontSize="small" />
                      )}
                    </IconButton>
                    {!isSuperAdminUser(item) && !isBranchAdmin(item) ? (
                      <IconButton
                        size="small"
                        className={`${styles.userListActionButton} ${styles.userListDeleteButton}`}
                        onClick={() => void handleDelete(item)}
                      >
                        <DeleteRoundedIcon fontSize="small" />
                      </IconButton>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyMiniState}>
              <Typography className={styles.emptyMiniTitle}>No users found</Typography>
              <Typography className={styles.emptyMiniText}>
                Create the first clinic user from the form panel.
              </Typography>
            </div>
          )}
        </div>
      </section>

      <section className={`${styles.formPanel} ${state.isUpdate ? styles.formPanelUpdating : ''}`}>
        <div className={styles.formPanelHeader}>
          <div className={styles.formPanelIcon} aria-hidden="true">
            <PersonAddAlt1RoundedIcon />
          </div>
          <div>
            <h3 className={styles.formPanelTitle}>
              {state.isUpdate ? 'Update User' : 'Create User'}
            </h3>
            <p className={styles.formPanelDescription}>
              {state.isUpdate
                ? 'Edit the selected clinic account. Leave the password fields empty if the password should stay the same.'
                : 'Use the same account fields as registration to create clinic users.'}
            </p>
            {!state.isUpdate && userLimit !== null ? (
              <p className={styles.formPanelDescription}>
                {subscriptionLabel} plan: {currentUserCount} of {userLimit} users used.
              </p>
            ) : null}
          </div>
        </div>

        {isCreateLimitReached ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {createLimitMessage}
          </Alert>
        ) : null}
        {isBranchAdminEditLocked ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Only Super Admin can update Branch Admin accounts.
          </Alert>
        ) : null}

        {!isBranchAdminEditLocked &&
        formValues.role === RegisterUserRole.BranchAdmin &&
        conflictingBranchAdmin ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {branchAdminConflictMessage}
          </Alert>
        ) : null}

        <fieldset
          disabled={isBranchAdminEditLocked}
          style={{ border: 0, margin: 0, padding: 0, minInlineSize: 0 }}
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Username"
                value={formValues.userName}
                onChange={(event) => handleTextChange('userName', event.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Email Address"
                type="email"
                value={formValues.emailAddress}
                onChange={(event) => handleTextChange('emailAddress', event.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="First Name"
                value={formValues.firstName}
                onChange={(event) => handleTextChange('firstName', event.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Middle Name"
                value={formValues.middleName}
                onChange={(event) => handleTextChange('middleName', event.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Last Name"
                value={formValues.lastName}
                onChange={(event) => handleTextChange('lastName', event.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Contact Number"
                value={formValues.contactNumber}
                onChange={(event) => handleTextChange('contactNumber', event.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Birth Date"
                type="date"
                value={formValues.birthDate}
                onChange={(event) => handleTextChange('birthDate', event.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Prefix"
                select
                value={formValues.preffix}
                onChange={(event) => handleTextChange('preffix', Number(event.target.value))}
                fullWidth
                size="small"
              >
                {REGISTER_PREFIX_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Suffix"
                select
                value={formValues.suffix}
                onChange={(event) => handleTextChange('suffix', Number(event.target.value))}
                fullWidth
                size="small"
              >
                {REGISTER_SUFFIX_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Role"
                select
                value={formValues.role}
                onChange={(event) => handleTextChange('role', Number(event.target.value))}
                fullWidth
                size="small"
              >
                {availableRoleOptions.map((option) => (
                  <MenuItem
                    key={option.value}
                    value={option.value}
                    disabled={
                      option.value === RegisterUserRole.BranchAdmin &&
                      (!canManageBranchAdminAccounts || Boolean(conflictingBranchAdmin))
                    }
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                label="Default Branch"
                select
                value={formValues.defaultBranchId}
                onChange={(event) => handleTextChange('defaultBranchId', event.target.value)}
                fullWidth
                size="small"
                required={branchAssignmentRequired}
                helperText={
                  formValues.role === RegisterUserRole.BranchAdmin && conflictingBranchAdmin
                    ? branchAdminConflictMessage
                    : branchAssignmentRequired
                    ? 'Branch-scoped users are restricted to this branch.'
                    : 'Clinic-wide users can keep access to all branches.'
                }
              >
                {canAssignClinicWideRoles ? <MenuItem value="">All Branches</MenuItem> : null}
                {branches.map((branch) => {
                  const existingBranchAdmin = branch.id
                    ? branchAdminAssignmentsByBranchId.get(branch.id)
                    : undefined;
                  const isBranchAdminBranchTaken =
                    formValues.role === RegisterUserRole.BranchAdmin &&
                    Boolean(existingBranchAdmin) &&
                    existingBranchAdmin?.id !== formValues.id;

                  return (
                    <MenuItem key={branch.id} value={branch.id} disabled={isBranchAdminBranchTaken}>
                      {branch.name || branch.code || 'Unnamed Branch'}
                    </MenuItem>
                  );
                })}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Start Date"
                type="date"
                value={formValues.startDate}
                onChange={(event) => handleTextChange('startDate', event.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Employment Type"
                select
                value={formValues.employmentType}
                onChange={(event) => handleTextChange('employmentType', Number(event.target.value))}
                fullWidth
                size="small"
              >
                {REGISTER_EMPLOYMENT_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Address"
                value={formValues.address}
                onChange={(event) => handleTextChange('address', event.target.value)}
                fullWidth
                size="small"
                multiline
                minRows={3}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Religion"
                value={formValues.religion}
                onChange={(event) => handleTextChange('religion', event.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                sx={{ height: '100%', alignItems: 'center' }}
                control={
                  <Switch
                    checked={formValues.isActive}
                    onChange={(event) => handleTextChange('isActive', event.target.checked)}
                  />
                }
                label="Active Account"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Bio"
                value={formValues.bio}
                onChange={(event) => handleTextChange('bio', event.target.value)}
                fullWidth
                size="small"
                multiline
                minRows={3}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label={state.isUpdate ? 'New Password' : 'Password'}
                type="password"
                value={formValues.password}
                onChange={(event) => handleTextChange('password', event.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label={state.isUpdate ? 'Confirm New Password' : 'Confirm Password'}
                type="password"
                value={formValues.confirmPassword}
                onChange={(event) => handleTextChange('confirmPassword', event.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
          </Grid>
        </fieldset>

        <Divider sx={{ my: 2 }} />

        <div className={styles.formActions}>
          {submitError ? (
            <Alert severity="error" sx={{ flex: 1, minWidth: 0 }}>
              {submitError}
            </Alert>
          ) : null}
          {statusMessage ? (
            <Alert severity="success" sx={{ flex: 1, minWidth: 0 }}>
              {statusMessage}
            </Alert>
          ) : null}
          {state.isUpdate ? (
            <button type="button" className={styles.secondaryActionButton} onClick={resetForm}>
              <span>Cancel</span>
            </button>
          ) : null}
          <button
            type="button"
            className={styles.primaryActionButton}
            onClick={() => void handleSubmit()}
            disabled={isCreateLimitReached || isBranchAdminEditLocked}
          >
            <SaveRoundedIcon />
            <span>{state.isUpdate ? 'Update User' : 'Create User'}</span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default CreateUserManagement;
