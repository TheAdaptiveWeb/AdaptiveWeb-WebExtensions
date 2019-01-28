import { Wrapper } from 'adaptiveweb';
import { WebExtStorageService } from './WebExtStorageService';
import { WebExtXHRService } from './WebExtXHRService';

/**
 * WebExtentions wrapper for AdaptiveWeb
 */
export class WebExtWrapper extends Wrapper {

    // Name - Used for tracking and reporting
    name = 'WebExtensions';
    
    // Services
    storage = new WebExtStorageService;
    xhr = new WebExtXHRService;

}