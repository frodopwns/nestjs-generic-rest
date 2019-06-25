import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  schemas: { [key: string]: any } = {};
  settings: any;
  constructor() {

    const schemaDir = path.resolve('schemas');
    console.log(schemaDir, '345');
    if (!fs.existsSync(schemaDir)) {
      console.log('no exist: ' + schemaDir);
      throw new Error('no schemas directory');
    }
    let schemasList: string[];
    try {
      schemasList = fs.readdirSync(schemaDir);
    } catch (err) {
      console.log(err);
    }

    schemasList.forEach(file => {
      const contents = fs.readFileSync(path.join(schemaDir, file));
      const parsed = JSON.parse(String(contents));
      console.log('parsed json');
      const props = Object.keys(parsed.properties);
      try {
        this.schemas[parsed.title.toLowerCase()] = {
          data: parsed,
          fields: props,
          selectors: props.map(item => `root.${item}`).concat(['root.id', 'root.key']).join(', '),
        };
      } catch (err) {
        console.log(err);
      }

    });

    const settingsFile = path.resolve('settings.json');
    if (!fs.existsSync(settingsFile)) {
      throw new Error('no settings file: ' + settingsFile);
    }

    try {
      const rawSettings = fs.readFileSync(settingsFile);
      this.settings = JSON.parse(String(rawSettings));
    } catch (err) {
      console.log('failed to parse settings.json file');
      throw err;
    }

  }
  // get env var, provide default
  getVar(k: string, d?: string | null): string {
    let v = this.findVar(k);
    if (v.length === 0 && d !== null) {
      v = d;
    }
    return v;
  }
  // get env var, raise error if missing
  getVarErr(k: string): string {
    const v = this.findVar(k);
    if (!v || v.length === 0) {
      console.log(`failed to get env var ${k}`);
      throw new Error('No environment variable named: ' + k);
    }
    return v;
  }
  findVar(k: string): string {
    let val: string;

    if (k in this.settings) {
      val = this.settings[k];
    }
    const envval = process.env[k];
    if (envval) {
      val = envval;
    }

    return val;
  }
}
