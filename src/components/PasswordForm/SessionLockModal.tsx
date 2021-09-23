import PasswordFormModal from './PasswordFormModal';

const SessionLockModal = props => {
  const { title, visible, successText, onValidatePassword, onSuccess, onCancel, successButtonText } = props;
  return PasswordFormModal({
    title,
    visible,
    successText,
    successButtonText,
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
