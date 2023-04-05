
let localStream;
let remoteStream;
let users = {}

let peerConnection;
let client = io("http://localhost:3000",{ transports: ["websocket"] })
document.getElementById('incoming-call').style.display='none'


const servers = {   
    iceServers:[
        {
            urls:['stun:stun1.l.google.com:19302']
        }
    ]
}

let constraints = {
    video:{
        width:{min:640, ideal:1920, max:1920},
        height:{min:480, ideal:1080, max:1080},
    },
    audio:true
}

let createPeerConnection = async (MemberId) => {
    peerConnection = new RTCPeerConnection(servers)

    remoteStream = new MediaStream()
    document.getElementById('user-2').srcObject = remoteStream
    document.getElementById('user-2').style.display = 'block'

    document.getElementById('user-1').classList.add('smallFrame')


    if(!localStream){
        localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false})
        document.getElementById('user-1').srcObject = localStream
    }

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track,localStream)
    })

    peerConnection.ontrack = (event) => {
        console.log("on remote track",event)
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track)
        })
    }

    peerConnection.onicecandidate = async (event) => {
        console.log('gen icecandidate',event)
        if(event.candidate){
            client.emit('candidate', {'candidate':event.candidate})
        }
    }
}

let createOffer = async (MemberId) => {
    console.log('create offer called')
    await createPeerConnection()

    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    client.emit('offer', {'offer':offer})
}

let createAnswer = async (data) => {
    console.log("offer received",data.offer)
    await createPeerConnection()

    await peerConnection.setRemoteDescription(data.offer)

    let answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    client.emit('answer', {'answer':answer})
}

let addAnswer = async (data) => {
    console.log('ans received',data.answer)
    if(!peerConnection.currentRemoteDescription){
        peerConnection.setRemoteDescription(data.answer)
    }
}

let leaveChannel = async () => {
    // await channel.leave()
    // await client.logout()
}

client.on('offer',createAnswer)
client.on('answer',addAnswer)
client.on('candidate',(data)=>{
    console.log('candidate',data)

    if(peerConnection){
        peerConnection.addIceCandidate(data.candidate)
    }
})
client.emit('get-users')
client.on('users',(data)=>{
    console.log('users')
    console.log(data)
    users = data
    userList()
})

client.on('incoming-call',(id)=>{
    console.log('incoming call from ', id)
    let ac = document.getElementById('incoming-call')
    ac.style.display=''
    document.getElementById('incoming-call-details').innerText="Call From "+users[id].name;
    console.log(ac.style)
    
})


let init = async () => {

    // client.on("connect", createOffer);

    localStream = await navigator.mediaDevices.getUserMedia(constraints)
    document.getElementById('user-1').srcObject = localStream
}

window.onload = ()=>{
    console.log('on load called')
    let person = prompt("Please enter your name");
    if(person){
        document.getElementById('name').textContent += " "+person
        client.emit('user-data',{name:person})
    }
}
// alert(window.onload)

function call(event){
    console.log(event.target.id)
    client.emit('call',event.target.id)
}

function userList(){
    let UserListElem = document.querySelector('#users-list')
    UserListElem.replaceChildren()
    console.log(UserListElem,users)
    Object.keys(users).forEach(k => {
        // users[k]
        console.log('in for loop')
        if(users[k]?.name){
            let li = document.createElement('li')
            let div = document.createElement('div')
            div.classList.add('user')

            li.appendChild(div)
            UserListElem.appendChild(li)

            let text = document.createElement('div')
            text.innerText=client.id === k ?users[k].name + " (you)" :  users[k].name
            
            let img = document.createElement('img')
            img.id = k
            img.src = "/assets/icons/conference.png"
            img.onclick =call
            // img.classList.add('user')

            div.appendChild(text)
            div.appendChild(img)
            // div.classList.add('.user')
            console.log(div)
        }
    })
}
init()
