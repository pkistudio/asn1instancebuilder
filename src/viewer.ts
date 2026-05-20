import PkiStudioOidResolver from '@pkistudio/pkistudiojs/oid-resolver';
import PkiStudio from '@pkistudio/pkistudiojs/viewer';
import './styles/styles.css';

window.addEventListener('DOMContentLoaded', () => {
  PkiStudio.init({
    mount: '#pkistudioViewer',
    fullscreen: true,
    oidResolver: PkiStudioOidResolver
  });
});
