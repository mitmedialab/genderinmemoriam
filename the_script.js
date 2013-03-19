var view;
var clicked;
var head;
var indexURL = "http://stuff.mit.edu/~sldiehl/Gender_In_Memoriam/index.html#";
  
  var Sentence = Backbone.Model.extend({});
  
  var SentenceCollection = Backbone.Collection.extend({
    model: Sentence
  });

  var IndexView = Backbone.View.extend({
    el: "#main",
    
    events: {
      "click #home_example" : "gotobooks"
    },
    
    gotobooks: function() {
      window.location = indexURL + 'book';
    },
  
    render: function() {
      var compiledTmpl = _.template($("#tmpl-index").html());
      $("#main").html(compiledTmpl());
    }
  });
  
  var HeaderView = Backbone.View.extend({
    el: "#header",
    
    initialize: function(header_type) {
      this.header_type = header_type;
    },
    
    events: {
      "click #relationships" : "relationships",
      "click #lifestories" : "lifestories",
      "click #professions" : "professions"
    },
    
    render: function() {
    
      if (this.header_type=="professions") {
        $.getJSON("topbar1.json", function(data) {
          var compiledTmpl = _.template($("#tmpl-professions").html());
          $("#header").html(compiledTmpl({words : data}));
        });
      } else if (this.header_type=="relationships") {
        $.getJSON("topbar2.json", function(data) {
          var compiledTmpl = _.template($("#tmpl-relationships").html());
          $("#header").html(compiledTmpl({words : data}));
        });
      } else if (this.header_type=="lifestories") {
        $.getJSON("topbar3.json", function(data) {
          var compiledTmpl = _.template($("#tmpl-lifestories").html());
          $("#header").html(compiledTmpl({words : data}));
        });
      };
    },

    relationships: function() {
      this.undelegateEvents();
      head = new HeaderView("relationships");
      head.render()
    },
    
    lifestories: function() {
      this.undelegateEvents();
      head = new HeaderView("lifestories");
      head.render()
    },
    
    professions: function() {
      this.undelegateEvents();
      head = new HeaderView("professions");
      head.render()
    },
    
  });
  
  var WordView = Backbone.View.extend({
  
    el: "#main",
    
    events: {
      "click .sentdiv" : "moveSentence",
      "click #click_instructions" : "newSentence"
    },
    
    render: function() {
    
      first_click = true;
    
      var compiledTmpl = _.template($("#tmpl-word").html());
      $("#main").html(compiledTmpl({data: this.collection.toJSON()}));
      var data = this.collection.toJSON();

      this.sentenceTemplate = _.template($("#tmpl-sentence").html());
      
      $("#click_instructions").hide();
      
      // raphael canvas for left y-axis labels
      var paper1 = new Raphael("raphdiv1", 50, 640);
      var paper2 = new Raphael("raphdiv2", 50, 570);
      
      // Draw y-axis label
      var y_label = paper1.text(10, 470, "Number of Word Uses per 100,000 Words");
      y_label.rotate(270);
      y_label.attr({"fill": '#000'});
      
      // Draw gender labels
      var fem_label = paper2.text(45, data[0].midline - 45, "female");
      fem_label.rotate(90);
      fem_label.attr({"fill": '#A68294', "font-size" : 14});
      
      var mal_label = paper2.text(45, data[0].midline + 55, "male");
      mal_label.rotate(90);
      mal_label.attr({"fill": '#7A8AA3', "font-size" : 14});
      
      // Draw y-axis markings
      var factor = 1 + Math.floor(1.85/data[0].s_f); //So markings won't overlap
      // Upper y-axis markings (female side)
      for (var i=0; Math.round(i*data[0].s_f) < data[0].max_height_fem; i += 10*factor) {
        paper1.text(38, data[0].midline + 110 - Math.round(i*data[0].s_f), i+'-').attr({"fill": '#000', "text-anchor": 'end'});
        paper2.text(17, data[0].midline + 4 - Math.round(i*data[0].s_f), '-'+i).attr({"fill": '#000', "text-anchor": 'start'});
      };
      // Lower y-axis markings
      for (var i=0; Math.round(i*data[0].s_f) < data[0].max_height_mal; i += 10*factor) {
        paper1.text(38, data[0].midline + 126 + Math.round(i*data[0].s_f), i+'-').attr({"fill": '#000', "text-anchor": 'end'});
        paper2.text(17, data[0].midline + 21 + Math.round(i*data[0].s_f), '-'+i).attr({"fill": '#000', "text-anchor": 'start'});
    };

      this.displaySentenceTable();
      
    },


    displaySentenceTable: function(){
      that = this;
      counter = {"male":0,"female":0}
      all_sentences = this.collection.toJSON();
      words_included = all_sentences[0].words_included.split(", ");
      all_sentences.splice(0,1)
      _.each(all_sentences, function(year){

        var gender = "male";
        if(year.id.search("fem") >=0){
          gender="female";
        }
        _.each(year.sentences, function(sentence){
          if(sentence.length <= 140 && sentence.length >= 80){
           if(counter[gender] <= 100){
              counter[gender] += 1
              sentence = sentence.replace("\'\'","");
              _.each(words_included, function(word){
                sentence = sentence.replace(word, "<span class='highlight'>" + word + "</span>");
              });
              $("#" + gender + "_sentences").append(that.sentenceTemplate({text:sentence, gender:gender}));
           }
          }
        });
      });
      console.log(1);
    }, 

    newSentence: function() {
      
      // Increment text displayed in last active sentdiv
      var actId = $("#active").attr('regId');
      var activeJSON = this.collection.get(actId).toJSON();
      var sentId = activeJSON.sentence_index;
      var sentLength = activeJSON.sentences.length;
      sentId = (parseInt(sentId) + 1) % sentLength;
      this.collection.get(actId).set("sentence_index", sentId);
      $('#active').html(activeJSON.sentences[sentId]);

    },
    
    moveSentence: function(e) {
      
      // Increment text displayed in last active sentdiv
      var actId = $("#active").attr('regId');
      var activeJSON = this.collection.get(actId).toJSON();
      var sentId = activeJSON.sentence_index;
      var sentLength = activeJSON.sentences.length;
      sentId = (parseInt(sentId) + 1) % sentLength;
      this.collection.get(actId).set("sentence_index", sentId);
      $('#active').html(activeJSON.sentences[sentId]);
      
      // If a different div has been clicked
      if (actId != $(e.target).attr('regId')||first_click) {
      
        // Show "active year" div
        $("#show_active_year").html("Year: "+$(e.target).attr("year"));
        
        // Animate formerly active div to its inactive position
        $("#active").animate({height: $("#active").attr('regHeight'), 
            left: $("#active").attr('regLeft'), 
            width:$("#active").attr('regWidth'), 
            top: $("#active").attr('regTop'),
            fontSize:10}, "fast");
        // Deactivate id
        $("#active").attr('id', actId);
        if (first_click) {
          first_click = false;
          $("#click_instructions").show();
          
        };
        
        // Animate newly active div to its active position
        $(e.target).animate({width:300, 
                height: 99,
                left: 412, 
                top: 145, 
                fontSize:12}, "fast");
        $(e.target).attr('id', 'active');
      }

    }
      
  });
  
  var WordRouter = Backbone.Router.extend({
    routes: {
      "" : "index",
      ":id" : "wordview"
    },
    
    index: function() {
      if (view) {view.undelegateEvents()};
      if (head) {head.undelegateEvents()};
      view = new IndexView();
      view.render();
      head = new HeaderView("professions");
      head.render()
    },
    
    wordview: function(id) {
    
      //remove old view's events
      if (view) {view.undelegateEvents()};
      if (head) {head.undelegateEvents()};
    
      $.getJSON(id+".json", function(data) {
        var sentColl = new SentenceCollection(data);
        view = new WordView({collection: sentColl});
        view.render();
        head = new HeaderView(data[0].header_type)
        head.render();
      });
    }
        
  });
  
  Router = new WordRouter();
  Backbone.history.start();
  $('#loadingDiv')
        .hide()  // hide it initially
        .ajaxStart(function() {
            $(this).show();
        })
        .ajaxStop(function() {
            $(this).hide();
        })
    ;
