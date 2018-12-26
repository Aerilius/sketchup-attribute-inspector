/**
 * Make a divider that synchronously upsizes one element and downsizes another.
 * @param {HTMLElement} element1
 * @param {HTMLElement} element2
 * @param {Object} options
 *        horizontal: whether the elements are arranged horizontally or vertically
 *        percent: whether the elements' dimensions should be set in percent or pixels
 */
$.fn.extend({
    divider: function (element1, element2, options) {
        options = $.extend({
            horizontal: true,
            percent: true,
            initial: 50,
            onChange: null // function
        }, options);

        var element = $(this),
            start, // Cursor coordinate (x or y) when the move operation started
            dim1,  // dimension (width or height) of the first element (left/top)
            dim2;  // dimension (width or height) of the second element (right/bottom)

        function init(event) {
            if (options.horizontal) {
                dim1  = element1.width();
                dim2  = element2.width();
                start = event.clientX;
            } else {
                dim1  = element1.height();
                dim2  = element2.height();
                start = event.clientY;
            }
        }

        function moveTo(newDim1, newDim2) {
            if (options.percent) {
                newDim1 += '%';
                newDim2 += '%';
            }
            if (options.horizontal) {
                element1.width(newDim1);
                element2.width(newDim2);
            } else {
                console.log('moveTo', newDim1, newDim2, element1, element2);
                element1.height(newDim1);
                element2.height(newDim2);
            }
        }

        function moveBy(delta) {
            var newDim1 = dim1 + delta,
                newDim2 = dim2 - delta;
            if (options.percent) {
                newDim1 = ( 100 * newDim1 / (dim1 + dim2) );
                newDim2 = ( 100 * newDim2 / (dim1 + dim2) );
            }
            moveTo(newDim1, newDim2);
        }

        function move(event) {
            var current = (options.horizontal) ? event.clientX : event.clientY;
            var delta   = current - start;
            moveBy(delta);
        }

        this.addClass('divider');
        this.css({cursor: (options.horizontal) ? 'col-resize' : 'row-resize'});

        // Add event listeners.
        this.on('mousedown', function (event) {
            // Register the status at the time of start.
            init(event);
            // Move the divider while the cursor moves.
            $(document).bind('mousemove', move);
            // Until the mouse button is released.
            $(document).bind('mouseup', function (event) {
                $(document).unbind('mousemove', move);
                // Trigger optional event handler.
                if (typeof options.onChange === 'function') {
                    options.onChange();
                }
            })
        });

        // Set initial position.
        if (typeof options.initial === 'number') {
            moveTo(options.initial, 100 - options.initial);
        }

        // We return again the jQuery object to allow chaining.
        return this;
    }
});
