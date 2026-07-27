// Routes aislop.codes/vynil-room/* to the vinyl-room app's Cloudflare Worker deployment.
//
// Cloudflare's "custom domain" binding on a project maps a whole hostname to it — there's no
// built-in way to scope that to just a subpath, which is what's needed here so aislop.codes/
// can later host a separate homepage while /vynil-room keeps serving this app. This Worker
// sits in front of the domain and, for any request under /vynil-room, strips that prefix and
// forwards to the app's own *.workers.dev origin (the app's build output lives at the plain
// root there — e.g. /assets/..., not /vynil-room/assets/... — since Vite's `base` setting only
// changes what paths the browser is told to request, not the on-disk layout of the build).
// Requests outside /vynil-room are left alone for the future homepage.

const APP_ORIGIN = 'https://vynilroom.wvstvvzy4g.workers.dev';
const MOUNT_PATH = '/vynil-room';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname !== MOUNT_PATH && !url.pathname.startsWith(`${MOUNT_PATH}/`)) {
      return fetch(request);
    }

    const forwardedPath = url.pathname.slice(MOUNT_PATH.length) || '/';
    const target = new URL(`${forwardedPath}${url.search}`, APP_ORIGIN);

    return fetch(new Request(target, request));
  },
};
