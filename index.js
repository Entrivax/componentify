/**
 * @param {{ template?: string, onCreated?: () => void, onMounted?: (target: HTMLElement) => void, onUnmounted?: () => void, onDestroyed?: () => void }} component 
 * @param {{ noContainer?: boolean, createElement?: (tagName: string) => HTMLElement }?} options 
 * @returns 
 */
function componentify (component, options) {
    /**
     * @type {<K extends keyof HTMLElementTagNameMap>(tagName: K, options?: ElementCreationOptions) => HTMLElementTagNameMap[K]}
     */
    var createElement = options && typeof options.createElement === 'function' ? options.createElement : document.createElement.bind(document)
    var noContainer = options && options.noContainer
    var newProto = {
        create: function () {
            if (this.__cCreated) {
                throw new Error('Component already created')
            }
            var container = createElement('div')
            var elements = [container]
            if (this.template) {
                container.innerHTML = this.template
            }

            var refElements = container.querySelectorAll('[ref]')
            var refs = {}
            for (var i = 0; i < refElements.length; i++) {
                var elem = refElements[i]
                var ref = elem.getAttribute('ref')
                if (!refs[ref]) {
                    refs[ref] = elem
                } else if (Array.isArray(refs[ref])) {
                    refs[ref].push(elem)
                } else {
                    refs[ref] = [refs[ref], elem]
                }
            }
            this.refs = refs

            if (noContainer) {
                elements = Array.prototype.slice.call(container.childNodes)
            } else {
                this.element = container
            }
            this.__cElements = elements
            this.__cCreated = true
            if (typeof this.onCreated === 'function') {
                this.onCreated()
            }
            return this
        },
        /**
         * @param {HTMLElement} target
         * @param {{ insertBefore?: HTMLElement, replace?: boolean }?} options
         */
        mount: function (target, options) {
            if (target == null) {
                throw new Error('Cannot mount component without target')
            }

            if (this.__cMounted) {
                throw new Error('Component already mounted')
            }

            if (!this.__cCreated) {
                this.create()
            }

            var replace = options && options.replace
            var insertBefore = replace ? target.nextSibling : (options && options.insertBefore ? options.insertBefore : null)
            var insertTarget = insertBefore ? insertBefore.parentElement : target.parentElement;
            for (var i = 0; i < this.__cElements.length; i++) {
                if (insertBefore) {
                    insertTarget.insertBefore(this.__cElements[i], insertBefore)
                } else if (replace) {
                    insertTarget.appendChild(this.__cElements[i])
                } else {
                    target.appendChild(this.__cElements[i])
                }
            }
            if (replace && target.parentElement) {
                target.parentElement.removeChild(target)
            }

            this.__cMounted = true

            if (typeof this.onMounted === 'function') {
                this.onMounted(target)
            }
            return this
        },
        unmount: function () {
            if (!this.__cMounted) {
                throw new Error('Component not mounted')
            }

            for (var i = 0; i < this.__cElements.length; i++) {
                var elem = this.__cElements[i]
                var parent = elem.parentElement
                if (parent) {
                    parent.removeChild(elem)
                }
            }

            this.__cMounted = false

            if (typeof this.onUnmounted === 'function') {
                this.onUnmounted()
            }
        },
        destroy: function () {
            if (this.__cMounted) {
                this.unmount()
            }

            delete this.__cElements
            delete this.element
            delete this.refs

            this.__cCreated = false

            if (typeof this.onDestroyed === 'function') {
                this.onDestroyed()
            }
        }
    }

    var keys = Object.keys(component)
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i]
        newProto[key] = component[key]
    }
    return newProto
}