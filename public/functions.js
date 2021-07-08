


let input = document.getElementById('url_input')
let answer = document.getElementById('answer_container')
let link = document.getElementById('link')
let button = document.getElementById('copy')
let login = document.getElementById('login_icon')
let login_form = document.getElementsByClassName('login_container')[0]
let auth = document.getElementsByClassName('auth')
let check_login = document.getElementById('check_login')
if(loggedIn = getCookie('username')){
    login.setAttribute('data-status',loggedIn)
}
input.onkeyup = function(e){

if(e.key == 'Enter'){
    if(input.value=='' || !input.checkValidity()){
        input.reportValidity()
        return
    }
    input.blur()
    axios.post('/shortUrl',{'original_url':input.value}).then((data,error)=>{
        if(data.data.success){
            answer.classList.add('show_container')
            link.href = data.data.success
            link.innerText = data.data.success
        }else{
            
            link.innerText = data.data.error
        }


    })

} 

}

button.onclick = function(){
   let temp = input.value
   input.value = link.innerText
   input.select()
   document.execCommand('copy')
   input.blur()
    input.value = temp

}

login.onclick = function(){
    if(loggedIn){
        window.location.replace('/profile')
    }
login_form.classList.add('show')
input.style.display = 'none'
answer.classList.remove('show_container')
}


auth[0].onkeyup = auth[1].onkeyup = function(e){
    auth[0].setCustomValidity('')
    auth[1].setCustomValidity('')
    
    if(e.key != 'Enter' || auth[0].value=='' || auth[1].value=='') return
    login_form.classList.remove('jiggle')
    if(check_login.checked){ //if login is checked we are sending login request
        axios.post('/login',{userName:auth[0].value,password:auth[1].value}).then((data)=>{
                if(data.data){
                    window.location.replace('/profile')
                                        
                }else{ // if login is incorrect play animation
                    login_form.classList.add('jiggle')
                }
            
        })
    }else{ // otherwise register is checked
        if(!auth[0].checkValidity() ||!auth[1].checkValidity()  ){

        auth[0].reportValidity() 
        auth[1].reportValidity()
            return
    }
        axios.post('/register',{userName:auth[0].value,password:auth[1].value}).then((data)=>{
            if(data.data.error){ // if user already exists
                auth[0].setCustomValidity(data.data.error)
                auth[0].reportValidity()
                auth[1].setCustomValidity(data.data.error)
                auth[1].reportValidity()
            
            }else{ // if everything is OK.
                let p = document.createElement('p')
                p.innerText = 'username has been registered, you can login now'
                p.style = 'color:white;font-size:20px;'
                auth[0].value=auth[1].value=''
                auth[0].focus()
                login_form.appendChild(p)
                check_login.checked= true

            }
        })
    }
}


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