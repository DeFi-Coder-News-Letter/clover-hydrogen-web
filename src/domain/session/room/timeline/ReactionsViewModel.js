/*
Copyright 2021 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import {ViewModel} from "../../../ViewModel.js";
import {ObservableMap} from "../../../../observable/map/ObservableMap.js";

export class ReactionsViewModel {
    constructor(parentEntry) {
        this._parentEntry = parentEntry;
        this._map = new ObservableMap();
        this._reactions = this._map.sortValues((a, b) => a._compare(b));
    }

    update(annotations, pendingAnnotations) {
        if (annotations) {
            for (const key in annotations) {
                if (annotations.hasOwnProperty(key)) {
                    const annotation = annotations[key];
                    const reaction = this._map.get(key);
                    if (reaction) {
                        if (reaction._tryUpdate(annotation)) {
                            this._map.update(key);
                        }
                    } else {
                        this._map.add(key, new ReactionViewModel(key, annotation, null, this._parentEntry));
                    }
                }
            }
        }
        if (pendingAnnotations) {
            for (const [key, count] of pendingAnnotations.entries()) {
                const reaction = this._map.get(key);
                if (reaction) {
                    if (reaction._tryUpdatePending(count)) {
                        this._map.update(key);
                    }
                } else {
                    this._map.add(key, new ReactionViewModel(key, null, count, this._parentEntry));
                }
            }
        }
        for (const existingKey of this._map.keys()) {
            const hasPending = pendingAnnotations?.has(existingKey);
            const hasRemote = annotations?.hasOwnProperty(existingKey);
            if (!hasRemote && !hasPending) {
                this._map.remove(existingKey);
            } else if (!hasRemote) {
                if (this._map.get(existingKey)._tryUpdate(null)) {
                    this._map.update(existingKey);
                }
            } else if (!hasPending) {
                if (this._map.get(existingKey)._tryUpdatePending(null)) {
                    this._map.update(existingKey);
                }
            }
        }
    }

    get reactions() {
        return this._reactions;
    }
}

class ReactionViewModel {
    constructor(key, annotation, pendingCount, parentEntry) {
        this._key = key;
        this._annotation = annotation;
        this._pendingCount = pendingCount;
        this._parentEntry = parentEntry;
    }

    _tryUpdate(annotation) {
        const oneSetAndOtherNot = !!this._annotation !== !!annotation;
        const bothSet = this._annotation && annotation;
        const areDifferent = bothSet &&  (
            annotation.me !== this._annotation.me ||
            annotation.count !== this._annotation.count ||
            annotation.firstTimestamp !== this._annotation.firstTimestamp
        );
        if (oneSetAndOtherNot || areDifferent) {
            this._annotation = annotation;
            return true;
        }
        return false;
    }

    _tryUpdatePending(pendingCount) {
        if (pendingCount !== this._pendingCount) {
            this._pendingCount = pendingCount;
            return true;
        }
        return false;
    }

    get key() {
        return this._key;
    }

    get count() {
        let count = 0;
        if (this._annotation) {
            count += this._annotation.count;
        }
        if (this._pendingCount !== null) {
            count += this._pendingCount;
        }
        return count;
    }

    get isPending() {
        return this._pendingCount !== null;
    }

    get haveReacted() {
        return this._annotation?.me || this.isPending;
    }

    _compare(other) {
        if (this.count !== other.count) {
            return other.count - this.count;
        } else {
            const a = this._annotation;
            const b = other._annotation;
            if (a && b) {
                return a.firstTimestamp - b.firstTimestamp;
            } else if (a) {
                return -1;
            } else {
                return 1;
            }
        }
    }

    toggleReaction() {
        const havePendingReaction = this._pendingCount > 0;
        const haveRemoteReaction = this._annotation?.me;
        const haveReaction = havePendingReaction || haveRemoteReaction;
        if (haveReaction) {
            return this._parentEntry.redactReaction(this.key);
        } else {
            return this._parentEntry.react(this.key);
        }
    }
}
