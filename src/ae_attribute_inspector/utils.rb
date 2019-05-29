module AE


  module AttributeInspector


    module Utils


      def self.log_error(error)
        if defined?(AE::ConsolePlugin)
          AE::ConsolePlugin.error(error)
        else
          $stderr.write(error.message + $/)
          $stderr.write(error.backtrace.join($/) + $/)
        end
      end


      def self.log_errors(&block)
        begin
          return block.call
        rescue Exception => error
          self.log_error(error)
        end
      end


    end


  end


end
