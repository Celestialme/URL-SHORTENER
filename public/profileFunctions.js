



let login = document.getElementById('login_icon')
let answer = document.getElementById('answer_container')
let button_copy = document.getElementById('copy')
let table = document.getElementsByClassName('table')[0]
let tableBody = document.getElementsByClassName('table_body')[0]
let input_container = document.getElementsByClassName('profile_input_container')[0]
let [button_create,button_myUrls,button_logout] = document.getElementsByClassName('controlls')
let [original_url,desired_url] =document.getElementsByClassName('profile_input')
login.setAttribute('data-status',getCookie('username'))



function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }


  
original_url.onkeyup = desired_url.onkeyup = function(e){
    
  if(e.key != 'Enter' ||original_url.value=='' || desired_url.value=='' ){
    return
  }else if(!original_url.checkValidity()){
    original_url.reportValidity()
    return
  }
    axios.post('/shortUrl',{original_url:original_url.value,desired_url:desired_url.value,login:getCookie('username')}).then((data)=>{
      original_url.blur()
      desired_url.blur()
      if(data.data.success){
        answer.classList.add('show_container')
        link.href = data.data.success
        link.innerText = data.data.success
    }else{
      answer.classList.add('show_container')
        link.innerText = data.data.error
    }
    } )
}
button_copy.onclick = function(){
  let temp = original_url.value
  original_url.value = link.innerText
  original_url.select()
  document.execCommand('copy')
  original_url.blur()
   original_url.value = temp

}
button_myUrls.onclick= function(){
  table.classList.remove('show')
  tableBody.innerHTML = ''  
  setTimeout(() => {
    table.classList.add('show')
  }, 100);
  
  

  input_container.classList.remove('show')
  answer.classList.remove('show_container')
  axios.post('/getMyUrls',{user:getCookie('username')}).then((data)=>{
  
    for (let i = 0; i < data.data.length; i++) {
      data.data[i]['shortUrl'] = window.location.protocol+'//'+window.location.host+'/'+data.data[i]['shortUrl']
      createTableEntry(Object.values(data.data[i]))
      
    }
  })
}

button_create.onclick = function(){
  input_container.classList.add('show')
  table.classList.remove('show')
}
button_logout.onclick = function(){
    document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC;"
    document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC;"
     window.location.replace('/')
    
 
    }


function createTableEntry(args){
  let columns = [document.createElement('div'),document.createElement('div'),document.createElement('div'),document.createElement('div'),document.createElement('div')]
  let table_row = document.createElement('div')
  table_row.className = 'table_row'
  let link = document.createElement('a')
  link.className='table_link'
  for (let i = 0; i < columns.length; i++) {
    columns[i].setAttribute('class','table_cell column'+(i+1))
    if(i==1){
      link.href = args[i]
      link.innerText = args[i]
      columns[i].appendChild(link)
    }else if(i==4){
      columns[i].innerText ='X';
      columns[i].style.fontFamily  = 'cursive'
      columns[i].classList.add('del')
      columns[i].onclick = function(){
        if(window.confirm('are you sure you want to delete?')){
          axios.post('deleteUrl',{ID:args[i]}).then((_)=>button_myUrls.click())
        }
      }
    }else{
      columns[i].innerText = args[i]
    }
    
    table_row.appendChild(columns[i])
    
  }
  tableBody.appendChild(table_row)
}