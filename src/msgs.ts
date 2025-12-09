import { Message } from "./types";

export function ageMessages(messages: Message[]) {
    let toDelete = [];
    messages.forEach((m: Message,i: number) => {
        m.age++;
        if (m.age > 4) toDelete.push(i);
    });
    toDelete.forEach(i => messages.splice(i, 1));
}

export function addMessage(content: string, messages: Message[]) {
    console.log(content);
    messages.unshift(new Message(content));
    if (messages.length > 3) {
        messages.pop();
    }
}