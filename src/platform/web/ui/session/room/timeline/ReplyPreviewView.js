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

import {renderStaticAvatar} from "../../../avatar";
import {TemplateView} from "../../../general/TemplateView";
import {viewClassForEntry} from "../common";

export class ReplyPreviewView extends TemplateView {
    render(t, vm) {
        return t.div({ className: "ReplyPreviewView" }, this._renderReplyPreview(t, vm));
    }

    _renderReplyPreview(t, vm) {
        const viewClass = viewClassForEntry(vm);
        const view = new viewClass(vm, { reply: true, interactive: false });
        if (!view) {
            throw new Error(`Shape ${vm.shape} is unrecognized.`)
        }
        const rendered = t.view(view);
        return this._renderReplyHeader(t, vm, [rendered]);
    }

    _renderReplyHeader(t, vm, children = []) {
        return t.blockquote(
            [
            t.a({ className: "link", href: vm.permaLink }, "In reply to"),
            t.a({ className: "pill", href: vm.senderProfileLink }, [renderStaticAvatar(vm, 12, undefined, true), vm.displayName]),
            t.br(),
            ...children
        ]);
    }
}

export class ReplyPreviewError extends TemplateView {
    render(t) {
        return t.blockquote({ className: "ReplyPreviewView" }, [
            t.div({ className: "Timeline_messageBody statusMessage" }, "This reply could not be found.")
        ]);
    }
}
