
/**
 *  Copyright 2019 The Adaptive Web. All Rights Reserved.
 * 
 *  Licensed under the Mozilla Public License 2.0 (the "License"). 
 *  You may not use this file except in compliance with the License.
 *  A copy of the License is located at
 *  
 *      https://www.mozilla.org/en-US/MPL/2.0/
 *  
 *  or in the "license" file accompanying this file. This file is distributed 
 *  on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either 
 *  express or implied. See the License for the specific language governing 
 *  permissions and limitations under the License.
 */
import { DOMService, AWElement, AWCard, AWButton, AWText } from "adaptiveweb";

export class WebExtAWElement implements AWElement {

    element: any;
    styleBeforeHidden: any;

    constructor(element: HTMLElement) {
        this.element = element;
    }
    
    appendChild(child: HTMLElement | AWElement) {
        if (child instanceof WebExtAWElement) this.element.appendChild(child.element);
        else this.element.appendChild(child);
    }

    setCSSProperty(key: string, value: string) {
        (<any>this.element.style)[key] = value;
    }

    setCSSProperties(properties: { [key: string] : string }) {
        if (properties === undefined) return;
        Object.keys(properties).forEach(key => {
            this.setCSSProperty(key, properties[key]);
        });
    }

    setSightedVisibility(visible: boolean) {
        if (visible) {
            this.setCSSProperties(this.styleBeforeHidden)
        } else {
            this.styleBeforeHidden = this.element.style;
            this.setCSSProperties({
                position: 'absolute',
                left: '-10000px',
                top: 'auto',
                width: '1px',
                height: '1px',
                overflow: 'hidden'
            })
        }
    }

}

export class WebExtAWCard extends WebExtAWElement implements AWCard {

    constructor(children: (HTMLElement | WebExtAWElement)[] = [], cssProperties: { [key: string] : string } = {}) {
        super(document.createElement('div'));

        // Set default CSS props
        this.setCSSProperties({
            backgroundColor: '#fff',
            color: '#000',
            boxShadow: '0px 2px 4px 0px rgba(0,0,0,0.5)',
            borderRadius: '3px',
            padding: '10px 10px',
            fontFamily: '\'Nunito\', sans-serif',
        });

        if (children !== undefined)
            children.forEach((child) => { this.appendChild(child); });
        
        this.setCSSProperties(cssProperties);
        this.element.addEventListener('click', (event: MouseEvent) => {
            event.stopPropagation();
        });
    }

}

export class WebExtAWButton extends WebExtAWElement implements AWButton {

    type: string;

    constructor(text: string = 'Button', onClick: Function = () => {}, type: string = 'default', cssProperties: { [key: string] : string }) {
        super(document.createElement('button'));

        this.element.innerText = text;
        this.type = type;
        this.element.onclick = () => onClick;


        // Set default CSS props
        this.setCSSProperties({
            backgroundColor: '#62A8E8',
            color: '#fff',
            boxShadow: '0px 1px 1px 0px rgba(0,0,0,0.5)',
            borderRadius: '3px',
            textTransform: 'uppercase',
            fontFamily: '\'Nunito\', sans-serif',
            display: 'inline-block',
            fontSize: '14px',
            border: 'none',
            padding: '8px 20px',
        });

        this.setCSSProperties(cssProperties);
    }

    setText(newText: string) {
        this.element.innerText = newText;
    }

    setType(newType: string) {
        this.type = newType;
    }

}

export class WebExtAWText extends WebExtAWElement implements AWText {

    constructor(text = 'Text', size = 18, cssProperties: { [key: string] : string }) {
        super(document.createElement('div'));
        this.element.innerText = text;

        // Default CSS props
        this.setCSSProperties({
            fontFamily: '\'Nunito\', sans-serif',
        })

        cssProperties.fontSize = size + 'px';
        this.setCSSProperties(cssProperties);
    }

    setText(newText: string) {
        this.element.innerText = newText;
    }

}

/**
 * WebExtensions implementation of the XHRService.
 */
export class WebExtDOMService implements DOMService {

    /**
     * Returns a card div
     * @param children the children of this element
     * @param cssProperties the css properties of the card
     */
    card(children: HTMLElement[], cssProperties: { [key: string] : string }): AWCard {
        return new WebExtAWCard(children, cssProperties);
    }

    /**
     * Returns a button
     * @param text the button text
     * @param onClick 
     * @param type 
     * @param cssProperties 
     */
    button(text: string, onClick: Function, type: string, cssProperties: { [key: string] : string }): AWButton {
        return new WebExtAWButton(text, onClick, type, cssProperties);
    }

    /**
     * Returns a text element
     * @param text 
     * @param size 
     * @param cssProperties 
     */
    text(text: string, size: number, cssProperties: { [key: string] : string }): AWText {
        return new WebExtAWText(text, size, cssProperties);
    }

}