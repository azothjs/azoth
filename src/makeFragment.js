const div = document.createElement( 'div' );

export default function makeFragment( html ) {
	div.innerHTML = html;
	clean( div );
	const { childNodes } = div;
	const fragment = document.createDocumentFragment();
	
	var node;
	while( node = childNodes[0] ) {
		fragment.appendChild( node );
	}
	
	return fragment;
}

// http://www.sitepoint.com/removing-useless-nodes-from-the-dom/
// TODO: get node type code
function clean(node)
{
  for(var n = 0; n < node.childNodes.length; n ++)
  {
    var child = node.childNodes[n];
    if
    (
      (child.nodeType === 3 && !/\S/.test(child.nodeValue))
    )
    {
      node.removeChild(child);
      n --;
    }
    else if(child.nodeType === 1)
    {
      clean(child);
    }
  }
}