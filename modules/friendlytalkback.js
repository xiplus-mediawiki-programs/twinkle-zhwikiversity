/*
 * vim: set noet sts=0 sw=8:
 ****************************************
 *** friendlytalkback.js: Talkback module
 ****************************************
 * Mode of invocation:     Tab ("TB")
 * Active on:              Existing user talk pages
 * Config directives in:   FriendlyConfig
 */
;(function(){

	Twinkle.talkback = function() {
	
		if ( Morebits.getPageAssociatedUser() === false ) {
			return;
		}
	
		twAddPortletLink( callback, "回复", "friendly-talkback", "回复通告" );
	};
	
	var callback = function( ) {
		if( Morebits.getPageAssociatedUser() === mw.config.get("wgUserName") && !confirm("您寂寞到了要自己回复自己的程度么？") ){
			return;
		}
	
		var Window = new Morebits.simpleWindow( 600, 350 );
		Window.setTitle("回复通告");
		Window.setScriptName("Twinkle");
		Window.addFooterLink( "关于{{talkback}}", "Template:Talkback" );
		Window.addFooterLink( "Twinkle帮助", "WP:TW/DOC#talkback" );
	
		var form = new Morebits.quickForm( callback_evaluate );
	
		form.append({ type: "radio", name: "tbtarget",
					list: [
						{
							label: "回复：我的对话页",
							value: "mytalk",
							checked: "true" 
						},
						{
							label: "回复：其他用户的对话页",
							value: "usertalk"
						},
						{
							label: "其它页面",
							value: "other"
						},
						{
							label: "“有新邮件”",
							value: "mail"
						}
					],
					event: callback_change_target
				});
	
		form.append({
				type: "field",
				label: "工作区",
				name: "work_area"
			});
	
		form.append({ type: "submit" });
	
		var result = form.render();
		Window.setContent( result );
		Window.display();
	
		// We must init the
		var evt = document.createEvent("Event");
		evt.initEvent( "change", true, true );
		result.tbtarget[0].dispatchEvent( evt );
	};
	
	var prev_page = "";
	var prev_section = "";
	var prev_message = "";
	
	var callback_change_target = function( e ) {
		var value = e.target.values;
		var root = e.target.form;
		var old_area = Morebits.quickForm.getElements(root, "work_area")[0];
	
		if(root.section) {
			prev_section = root.section.value;
		}
		if(root.message) {
			prev_message = root.message.value;
		}
		if(root.page) {
			prev_page = root.page.value;
		}

		var work_area = new Morebits.quickForm.element({
				type: "field",
				label: "回复通告信息",
				name: "work_area"
			});
	
		switch( value ) {
			case "mytalk":
				/* falls through */
			default:
				work_area.append({
						type:"input",
						name:"section",
						label:"小节（可选）",
						tooltip:"您留下消息的小节标题。",
						value: prev_section
					});
				break;
			case "usertalk":
				work_area.append({
						type:"input",
						name:"page",
						label:"用户",
						tooltip:"您留下消息的用户名。",
						value: prev_page
					});
				
				work_area.append({
						type:"input",
						name:"section",
						label:"小节（可选）",
						tooltip:"您留下消息的小节标题。",
						value: prev_section
					});
				break;
			case "other":
				work_area.append({
						type:"input",
						name:"page",
						label:"完整页面名",
						tooltip:"您留下消息的完整页面名，比如“Wikipedia talk:Twinkle”。",
						value: prev_page
					});
				
				work_area.append({
						type:"input",
						name:"section",
						label:"小节（可选）",
						tooltip:"您留下消息的小节标题。",
						value: prev_section
					});
				break;
			case "mail":
				work_area.append({
						type:"input",
						name:"section",
						label:"电子邮件主题（可选）",
						tooltip:"您发出的电子邮件的主题。"
					});
				break;
		}
	
		if (value !== "notice") {
			work_area.append({ type:"textarea", label:"附加信息（可选）：", name:"message", tooltip:"会在回复通告模板下出现的消息，您的签名会被加在最后。" });
		}
	
		work_area = work_area.render();
		root.replaceChild( work_area, old_area );
		if (root.message) {
			root.message.value = prev_message;
		}
	};
	
	var callback_evaluate = function( e ) {
	
		var tbtarget = e.target.getChecked( "tbtarget" )[0];
		var page = null;
		var section = e.target.section.value;
		var fullUserTalkPageName = mw.config.get("wgFormattedNamespaces")[ mw.config.get("wgNamespaceIds").user_talk ] + ":" + Morebits.getPageAssociatedUser();
	
		if( tbtarget === "usertalk" || tbtarget === "other" ) {
			page = e.target.page.value;
			
			if( tbtarget === "usertalk" ) {
				if( !page ) {
					alert("您必须指定用户名。");
					return;
				}
			} else {
				if( !page ) {
					alert("您必须指定页面名。");
					return;
				}
			}
		}
	
		var message;
		if (e.target.message) {
			message = e.target.message.value;
		}
	
		Morebits.simpleWindow.setButtonsEnabled( false );
		Morebits.status.init( e.target );
	
		Morebits.wiki.actionCompleted.redirect = fullUserTalkPageName;
		Morebits.wiki.actionCompleted.notice = "回复通告完成，将在几秒内刷新";
	
		var talkpage = new Morebits.wiki.page(fullUserTalkPageName, "添加回复通告");
		var tbPageName = (tbtarget === "mytalk") ? mw.config.get("wgUserName") : page;
	
		var text;
		if ( tbtarget === "mail" ) {
			text = "\n\n==" + Twinkle.getFriendlyPref("mailHeading") + "==\n{{you've got mail|subject=";
			text += section + "|ts=~~~~~}}";

			if( message ) {
				text += "\n" + message + "--~~~~";
			} else if( Twinkle.getFriendlyPref("insertTalkbackSignature") ) {
				text += "\n~~~~";
			}

			talkpage.setEditSummary("通知：有新邮件" + Twinkle.getPref("summaryAd"));

		} else {
			//clean talkback heading: strip section header markers, were erroneously suggested in the documentation
			text = "\n\n==" + Twinkle.getFriendlyPref("talkbackHeading").replace( /^\s*=+\s*(.*?)\s*=+$\s*/, "$1" ) + "==\n{{talkback|";
			text += tbPageName;

			if( section ) {
				text += "|" + section;
			}
	
			text += "|ts=~~~~~}}";
	
			if( message ) {
				text += "\n" + message + "--~~~~";
			} else if( Twinkle.getFriendlyPref("insertTalkbackSignature") ) {
				text += "\n~~~~";
			}
	
			talkpage.setEditSummary("回复通告（[[" + (tbtarget === "other" ? "" : "User talk:") + tbPageName +
				(section ? ("#" + section) : "") + "]]）" + Twinkle.getPref("summaryAd"));
		}
	
		talkpage.setAppendText( text );
		talkpage.setCreateOption("recreate");
		talkpage.setMinorEdit(Twinkle.getFriendlyPref("markTalkbackAsMinor"));
		talkpage.setFollowRedirect( true );
		talkpage.append();
	};

}());
