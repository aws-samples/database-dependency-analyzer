import {
  Modal,
  Box,
  SpaceBetween,
  Button,
  Toggle,
} from "@cloudscape-design/components";
import { forwardRef, useImperativeHandle, useState } from "react";
import {
  applySettings,
  isCompactModeEnabled,
  isDarkModeEnabled,
  setCompactMode,
  setDarkMode,
  useAppSettings,
} from "../../utils/AppSettings";

export interface SettingsModalActions {
  open: () => void;
}

type Props = object;

const SettingsModal = forwardRef<SettingsModalActions, Props>((_props, ref) => {
  const appSettingsWrapper = useAppSettings();
  const [visible, setVisible] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(isDarkModeEnabled());
  const [compactModeEnabled, setCompactModeEnabled] = useState(
    isCompactModeEnabled(),
  );

  const confirmSettings = () => {
    setDarkMode(darkModeEnabled, appSettingsWrapper);
    setCompactMode(compactModeEnabled, appSettingsWrapper);
    applySettings();
    setVisible(false);
  };

  useImperativeHandle(ref, () => {
    return {
      open: () => {
        setDarkModeEnabled(isDarkModeEnabled());
        setCompactModeEnabled(isCompactModeEnabled());
        setVisible(true);
      },
    } as SettingsModalActions;
  });

  return (
    <Modal
      onDismiss={() => setVisible(false)}
      visible={visible}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => setVisible(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => confirmSettings()}>
              Confirm
            </Button>
          </SpaceBetween>
        </Box>
      }
      header="App Settings"
    >
      <SpaceBetween size="s">
        <Toggle
          onChange={({ detail }) => setDarkModeEnabled(detail.checked)}
          checked={darkModeEnabled}
        >
          Dark mode
        </Toggle>
        <Toggle
          onChange={({ detail }) => setCompactModeEnabled(detail.checked)}
          checked={compactModeEnabled}
        >
          Compact mode
        </Toggle>
      </SpaceBetween>
    </Modal>
  );
});

export default SettingsModal;
