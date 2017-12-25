(function() {
	window.dropArea = function dropArea(elem, afterDrop) {
		elem.ondragover = function() {
			this.classList.add('dragOver');
			return false;
		};
		elem.ondragend = function() {
			this.classList.remove('dragOver');
			return false;
		};
		elem.ondragleave = function() {
			this.classList.remove('dragOver');
			return false;
		};
		elem.ondrop = function(event) {
			event.stopPropagation();
			event.preventDefault();
			this.classList.remove('dragOver');
			var file = event.dataTransfer.files[0];
			if (afterDrop)
				afterDrop(this, file);
		};
	};
})();
