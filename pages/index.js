import { collection, addDoc, onSnapshot, query, doc, updateDoc,deleteDoc} from "firebase/firestore";
import { db } from "../firebase/config.js";
import { useState, useEffect } from "react";

if ('Notification' in window) {
  Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      console.log('Notification permission granted.')
    }
  });
}
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_APPLICATION_SERVER_KEY,
    }).then((subscription) => {
      console.log('Subscribed:', subscription.endpoint);
    }).catch((error) => {
      console.log('Subscription failed:', error);
    });
  });
}

const webpush = require('web-push');

const pushSubscription = {
  endpoint: 'https://'+process.env.NEXT_PUBLIC_DOMAIN,
  keys: {
    p256dh: 'public key',
    auth: 'auth token'
  }
};

const payload = JSON.stringify({
  title: 'Hello!',
  message: 'This is a push notification from Next.js!'
});

webpush.sendNotification(pushSubscription, payload).catch((error) => {
  console.log('Push notification failed:', error);
});

self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.message,
    icon: '/logo.png',
    vibrate: [100, 50, 100]
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});



const unsub = onSnapshot(doc(db, "cities", "SF"), (doc) => {
    const source = doc.metadata.hasPendingWrites ? "Local" : "Server";
    console.log(source, " data: ", doc.data());
  });

const Todo = () => {
  const [todos, setTodos] = useState([]);
  
  const create = async (e) => {
      e.preventDefault();
      try {
          const docRef = await addDoc(collection(db, "todo"), {
              name: e.target.name.value,
              status: e.target.status.value,
            });
            console.log("Document written with ID: ", docRef.id);
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    }
    
    const update = (e, id)=> {
    e.preventDefault();
    try{
        const todoRef = doc(db, "todo", id);
        updateDoc(todoRef, {
          name: e.target.name.value,
          status: e.target.status.value,
        })
        setTodos(todos.map((todo) => {
          if(todo.id === id){
            return {
              id,
              name: e.target.name.value,
              status: e.target.status.value,
            }
        }else{
            return todo;
        }
        }
        ))
      }catch(e){
          console.error("Error updating document: ",e);
      }
    }
  
  const read = () => {
    try {
      const q = query(collection(db, "todo"));
      onSnapshot(q, (querySnapshot) => {
        const tempTodos = [];
        querySnapshot.forEach((doc) => {
          tempTodos.push({id: doc.id, ...doc.data()});
        }
        );
        setTodos(tempTodos);
      })
    } catch (e) {
      console.error("Error adding document: ", e);
    }
    
  }
  const destroy = async (e, id) => {
    try {
      e.preventDefault();
      await deleteDoc(doc(db,'todo', id));
      }
    catch (e) {
      console.error("Error deleting document: ", e);
    }
  }
  useEffect(() => {
    read();
  }, [])

    return (
        <div>
            <h1>Todo</h1>
            <form onSubmit={(e) => create(e)}>
                <input name="name"></input>
                <input name="status"></input>
                <button type="submit">Add</button>
            </form>
            <ul>
              {todos.map((todo) => {
                return (
                <div key={todo.id}>
                  <form onSubmit={(e) => {update(e, todo.id)}}>
                  <input name="id" defaultValue={todo.id} hidden/>
                  <input name="name" defaultValue={todo.name} />
                  <input name="status" defaultValue={todo.status} />
                    <button>更新</button>
                  </form>
                  <form onSubmit={(e)=>{destroy(e,todo.id)}}>
                    <button>削除</button>
                  </form>
                </div>
                )
              })}
            </ul>
        </div>
    )
}

export default Todo