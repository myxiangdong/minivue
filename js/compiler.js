class Compiler{
	constructor(vm) {
	    this.el = vm.$el
		this.vm = vm
		this.compile(this.el)
	}
	// 编译模板，处理文本节点和元素节点
	compile(el){
		let childNodes = el.childNodes
		Array.from(childNodes).forEach(node => {
			//处理文本节点
			if(this.isTextNode(node)){
				this.compileText(node)
			}else if(this.isElementNode(node)){
				//处理元素节点
				this.compileElement(node)
			}
			
			// 判断当前节点下是否有子节点,有子节点时递归遍历compile
			if(node.childNodes && node.childNodes.length){
				this.compile(node)
			}
		})
	}
	// 编译文本节点
	compileText(node){
		let reg = /\{\{(.+?)\}\}/
		let value = node.textContent
		if(reg.test(value)){
			let key = RegExp.$1.trim()
			node.textContent = value.replace(reg,this.vm[key]) 
		}
	}
	// 编译元素节点,处理指令
	compileElement(node){
		let onRE = /^@|^v-on:/
		Array.from(node.attributes).forEach(attr => {
			let attrName = attr.name
			if(onRE.test(attrName)){//处理v-on
				attrName = attrName.replace(onRE, '')
				let key = attr.value
				this.addHandler(node,attrName,this.vm[key])
			}else if(this.isDirective(attrName)){
				// v-text --> text
				attrName = attrName.substr(2)
				let key = attr.value
				this.update(node, key, attrName)
			}
		}) 
	}
	addHandler(el, handleName, handle){
		el.addEventListener(handleName,handle)
	}
	update(node, key, attrName){
		let updateFn = this[attrName+'Updater']
		updateFn && updateFn.call(this,node, this.vm[key], key)
	}
	// 处理 v-text 指令
	textUpdater(node, value, key){
		node.textContent = value
		new Watcher(this.vm, key, (newValue) => {
		  node.textContent = newValue
		})
	}
	// 处理 v-model 指令
	modelUpdater(node, value, key){
		node.value = value
		new Watcher(this.vm, key, (newValue) => {
		  node.value = newValue
		})
		// 双向绑定
		node.addEventListener('input', () => {
		  this.vm[key] = node.value
		})
	}
	// 处理 v-html 指令
	htmlUpdater(node, value, key){
		node.innerHTML = value
		new Watcher(this.vm, key, (newValue) => {
		  node.innerHTML = newValue
		})
	}
	// 判断元素属性是否是指令
	isDirective (attrName) {
	  return attrName.startsWith('v-')
	}
	//判断是否为文本节点
	isTextNode(node){
		return node.nodeType === 3
	}
	//判断是否为元素节点
	isElementNode(node){
		return node.nodeType === 1
	}
}