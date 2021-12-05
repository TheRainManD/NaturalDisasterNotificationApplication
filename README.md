## Natural Disaster Notification Application  
Note: All API keys and secrets in the application were removed for security and privacy concerns.  
<br>  

### Motivation  
Receiving information in time is crucial in the event of natural disasters. Platform like Twitter has large potential to be used in this area. Verified accounts like "USGS" is controlled by offcial government agencies which ensures the validity of information. However, it's common for these accounts to post non-emergency information like preventive posts and replying to other Tweets. Receiving all these information in notification could be overwhelming to users and decrease the feeling of urgentcy for such notification. We wanted to build an application which could filter out all non-emergency posts and deliver only emergency Tweets to users as notification while preserving the ability for users  to choose the type of natural disasters and matching locations to receive notification on just like the flexibility to follow different accounts on Twitter.  

### Application Architecture  
![Application Architecture](/img/project_architecture.pdf "Application Architecture")
Our application contains four main components based on their functionalities. Pull server is responsible to maintain a Tweet stream and listen for new Tweet posts from our list of verified accounts. Any new Tweet along with its metadata will be sent to Analysis Server via a HTTP request. Analysis Server is responsible to classify whether the Tweet is related to an actual disaster incident and classify it to be one of the disaster types. It will also extract all the location strings from the text. If the received Tweet
is related to an actual disaster incident, all these information willbe sent to Notification Server via a HTTP request. Notification Server is responsible to send out push notification to users who subscribes to matching disaster types and matching locations. The frontend application is responsible to receive notifications and provide user interface like setting subscriptions or viewing nearby disasters.
