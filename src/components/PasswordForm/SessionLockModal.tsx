import PasswordFormModal from './PasswordFormModal';

const SessionLockModal = props => {
  const { title, visible, successText, onValidatePassword, onSuccess, onCancel } = props;
  return PasswordFormModal({
    title,
    visible,
    successText,
    onValidatePassword,
    onSuccess,
    onCancel,
    mask: true,
    maskStyle: {
      backdropFilter: 'blur(5px)',
    },
    closable: false,
    keyboard: false,
    maskClosable: false,
  });
};

export default SessionLockModal;
