import { initAsn1InstanceBuilder } from './app/main.js';
import './styles/styles.css';

export { initAsn1InstanceBuilder } from './app/main.js';
export type { Asn1InstanceBuilderApp, Asn1InstanceBuilderAppOptions } from './app/main.js';

if (typeof document !== 'undefined') {
  const mount = document.querySelector<HTMLElement>('#app');
  if (mount) initAsn1InstanceBuilder({ mount });
}
