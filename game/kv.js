const PREFIX = "grey-knight:";

/** @param {string} key */
export const get = (key) => localStorage.getItem(PREFIX + key);

/**
 * @param {string} key
 * @param {string} value
 */
export const set = (key, value) => localStorage.setItem(PREFIX + key, value);

/** @param {string} key */
export const remove = (key) => localStorage.removeItem(PREFIX + key);

function profileKey() {
	const account = get("session");
	return account === null ? null : `${PREFIX}profile:${account}`;
}

export function getProfile() {
	const key = profileKey();
	if (!key) {
		return { codex: [], progress: null, rewards: {} };
	}
	try {
		return {
			codex: [],
			progress: null,
			rewards: {},
			...JSON.parse(localStorage.getItem(key) ?? "{}"),
		};
	} catch {
		return { codex: [], progress: null, rewards: {} };
	}
}

export function setProfile(profile) {
	const key = profileKey();
	if (key) {
		localStorage.setItem(key, JSON.stringify(profile));
	}
}
