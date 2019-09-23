import Command from './command'
import { Context } from '../types'

import { Requirements } from '../types'

import { execute_python_script } from '../core'
import { get_requirements, set_requirements } from '../notebook'
import { dedent, display } from '../utils'
import { Pipfile } from '../thoth'

// Jupyter runtime environment
// @ts-ignore
import Jupyter = require("base/js/namespace")


export class Help extends Command {
    public message: string = "Provide valid command. See --help for more info."

    constructor(message?: string) {
        super()
        if (message) this.message = message
    }

    public run(args: any, element: HTMLDivElement): void {
        // Append to the cell output
        display(this.message, element)
    }
}


export class Get extends Command {

    public async run(args: any, element: HTMLDivElement): Promise<void> {
        this.validate(args)
        try {
            let req = await get_requirements(Jupyter.notebook, args.ignore_metadata)
            if (args.to_json) {
                // Append to the cell output
                display(req, element)
            }
            else if (args.to_file) {// Create the Pipfile in the current repository
                return await Pipfile.create(req)
                    .then(() => {
                        console.log("Pipfile has been sucessfully created.")
                    })
                    .catch((err: string | Error) => {
                        console.error(err)
                    })
            }
            else {// default, display requirements in Pipfile format
                const json = JSON.stringify(req)
                // TODO: Turn this into a template
                await execute_python_script(
                    dedent(`\n                    from thoth.python import Pipfile\n                    print(\n                        Pipfile.from_dict(json.loads('${json}')).to_string()\n                    )`)
                )
            }
        }
        catch (err) {
            console.error("Failed to get requirements.\n", err)
        }
    }

    protected validate(args: any): void | never { /* TODO */ }
}

export class Set extends Command {

    public run(args: any): void {
        const req: Requirements = args.requirements

        set_requirements(Jupyter.notebook, req)
    }
}
