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