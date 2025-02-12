/*
 * Copyright 2022 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ConfigReader } from '@backstage/config';
import { Duration } from 'luxon';
import { readTaskScheduleDefinitionFromConfig } from './readTaskScheduleDefinitionFromConfig';
import { HumanDuration } from './types';

describe('readTaskScheduleDefinitionFromConfig', () => {
  it('all valid values', () => {
    const config = new ConfigReader({
      frequency: {
        cron: '0 30 * * * *',
      },
      timeout: 'PT3M',
      initialDelay: {
        minutes: 20,
      },
      scope: 'global',
    });

    const result = readTaskScheduleDefinitionFromConfig(config);

    expect((result.frequency as { cron: string }).cron).toBe('0 30 * * * *');
    expect(result.timeout).toEqual(Duration.fromISO('PT3M'));
    expect((result.initialDelay as HumanDuration).minutes).toEqual(20);
    expect(result.scope).toBe('global');
  });

  it('all valid required values', () => {
    const config = new ConfigReader({
      frequency: {
        cron: '0 30 * * * *',
      },
      timeout: 'PT3M',
    });

    const result = readTaskScheduleDefinitionFromConfig(config);

    expect((result.frequency as { cron: string }).cron).toBe('0 30 * * * *');
    expect(result.timeout).toEqual(Duration.fromISO('PT3M'));
    expect(result.initialDelay).toBeUndefined();
    expect(result.scope).toBeUndefined();
  });

  it('fail without required frequency', () => {
    const config = new ConfigReader({
      timeout: 'PT3M',
    });

    expect(() => readTaskScheduleDefinitionFromConfig(config)).toThrow(
      "Missing required config value at 'frequency'",
    );
  });

  it('fail without required timeout', () => {
    const config = new ConfigReader({
      frequency: 'PT30M',
    });

    expect(() => readTaskScheduleDefinitionFromConfig(config)).toThrow(
      "Missing required config value at 'timeout'",
    );
  });

  it('invalid frequency value', () => {
    const config = new ConfigReader({
      frequency: {
        invalid: 'value',
      },
      timeout: 'PT3M',
    });

    expect(() => readTaskScheduleDefinitionFromConfig(config)).toThrow(
      'HumanDuration needs at least one of',
    );
  });

  it('frequency value with additional invalid prop', () => {
    const config = new ConfigReader({
      frequency: {
        minutes: 20,
        invalid: 'value',
      },
      timeout: 'PT3M',
    });

    expect(() => readTaskScheduleDefinitionFromConfig(config)).toThrow(
      'HumanDuration does not contain properties: invalid',
    );
  });

  it('invalid scope value', () => {
    const config = new ConfigReader({
      frequency: {
        years: 2,
      },
      timeout: 'PT3M',
      scope: 'invalid',
    });

    expect(() => readTaskScheduleDefinitionFromConfig(config)).toThrow(
      'Only "global" or "local" are allowed for TaskScheduleDefinition.scope, but got: invalid',
    );
  });
});
