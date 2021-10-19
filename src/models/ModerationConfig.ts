export interface ModerationConfig {
  config: Config;
}

export interface Config {
  validators: Validators;
}

export interface Validators {
  warning: any[];
  suspicious: string[];
}

export function isValidatorAddressSuspicious(address: string, config?: ModerationConfig): boolean {
  return !!config?.config?.validators?.warning
    ?.concat(config?.config?.validators?.suspicious)
    .includes(address);
}
